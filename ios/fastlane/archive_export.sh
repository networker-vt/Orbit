#!/usr/bin/env bash
# Archive unsigned, then cloud-sign at export.
#
# Automatic signing during `xcodebuild archive` (-allowProvisioningUpdates) makes
# each ephemeral GitHub runner mint a new Apple Development certificate and
# eventually hits the account certificate cap. The archive is therefore unsigned.
# `xcodebuild -exportArchive` applies Xcode cloud signing with the App Store
# Connect API key and reuses one distribution certificate.
#
# Runs on the macOS runner. Invoked by ios/fastlane/Fastfile.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

die() {
  echo "::error::$1" >&2
  exit 1
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    die "archive_export.sh missing $name"
  fi
}

for name in APPLE_TEAM_ID ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH ORBIT_MARKETING_VERSION ORBIT_BUILD_NUMBER; do
  require_var "$name"
done

if [[ ! -f "$ASC_KEY_PATH" ]]; then
  die "App Store Connect API key file is missing on the runner. The Fastlane lane should write it before archive."
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  die "xcodebuild is not installed. This step must run on a macOS runner with Xcode 26 or newer."
fi

xcode_version="$(xcodebuild -version | awk '/^Xcode / { print $2; exit }')"
xcode_major="${xcode_version%%.*}"
if [[ -z "$xcode_major" || "$xcode_major" -lt 26 ]]; then
  die "Need Xcode 26 or newer to upload to App Store Connect (Apple requirement since 2026-04-28). Found ${xcode_version:-none}."
fi

PROJECT="$ROOT/ios/App/App.xcodeproj"
SCHEME="App"
if [[ ! -d "$PROJECT" ]]; then
  die "Xcode project not found at ios/App/App.xcodeproj"
fi
if [[ ! -f "$PROJECT/xcshareddata/xcschemes/App.xcscheme" ]]; then
  die "Shared scheme App.xcscheme is missing. xcodebuild cannot archive without it."
fi

OUT="${ORBIT_ARCHIVE_DIR:-$ROOT/ios/build}"
ARCHIVE="$OUT/App.xcarchive"
EXPORT="$OUT/export"
DERIVED="$OUT/DerivedData"
EXPORT_OPTIONS="$OUT/ExportOptions.plist"

rm -rf "$ARCHIVE" "$EXPORT" "$DERIVED"
mkdir -p "$OUT" "$EXPORT"

echo "Archiving Allda ${ORBIT_MARKETING_VERSION} (${ORBIT_BUILD_NUMBER}) unsigned."
xcodebuild archive \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE" \
  -derivedDataPath "$DERIVED" \
  -skipMacroValidation \
  -skipPackagePluginValidation \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="app.orbit.companion" \
  MARKETING_VERSION="$ORBIT_MARKETING_VERSION" \
  CURRENT_PROJECT_VERSION="$ORBIT_BUILD_NUMBER" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY=""

if [[ ! -d "$ARCHIVE" ]]; then
  die "xcodebuild archive did not produce $ARCHIVE"
fi

rm -f "$EXPORT_OPTIONS"
plutil -create xml1 "$EXPORT_OPTIONS"
plutil -insert method -string app-store-connect "$EXPORT_OPTIONS"
plutil -insert destination -string export "$EXPORT_OPTIONS"
plutil -insert signingStyle -string automatic "$EXPORT_OPTIONS"
plutil -insert teamID -string "$APPLE_TEAM_ID" "$EXPORT_OPTIONS"
plutil -insert manageAppVersionAndBuildNumber -bool NO "$EXPORT_OPTIONS"
plutil -insert uploadSymbols -bool YES "$EXPORT_OPTIONS"
plutil -insert stripSwiftSymbols -bool YES "$EXPORT_OPTIONS"
plutil -insert testFlightInternalTestingOnly -bool YES "$EXPORT_OPTIONS"

echo "Exporting IPA with Xcode cloud signing (distribution cert is reused)."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

ipa=""
for candidate in "$EXPORT"/*.ipa; do
  if [[ -f "$candidate" ]]; then
    ipa="$candidate"
    break
  fi
done
if [[ -z "$ipa" ]]; then
  die "Export produced no .ipa in $EXPORT"
fi

printf '%s\n' "$ipa" > "$OUT/ipa-path.txt"
cat > "$OUT/build-info.txt" <<EOF
marketing_version=${ORBIT_MARKETING_VERSION}
build_number=${ORBIT_BUILD_NUMBER}
bundle_id=app.orbit.companion
ipa=$(basename "$ipa")
EOF

echo "Exported $(basename "$ipa")"
