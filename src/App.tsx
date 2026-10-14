import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './lib/auth'
import { AppUnlockGate } from './components/security/AppUnlockGate'
import { I18nProvider, useI18n } from './lib/i18n'
import { initRewards } from './lib/rewards'
import { initStore } from './lib/store'
import { OrbitWordmarkHero } from './components/brand/OrbitWordmarkHero'
import { HomePage } from './pages/HomePage'
import { ModeChooserPage } from './pages/onboarding/ModeChooserPage'
import { KidsConsentPage } from './pages/onboarding/KidsConsentPage'
import { OrbitRegistrationPage } from './pages/onboarding/OrbitRegistrationPage'
import { MitentwickelnPage } from './pages/MitentwickelnPage'
import { KidsHubPage } from './pages/kids/KidsHubPage'
import { KidsSpielePage } from './pages/kids/KidsSpielePage'
import { KidsLernenPage } from './pages/kids/KidsLernenPage'
import { KidsHobbiesPage } from './pages/kids/KidsHobbiesPage'
import { KidsNaturPage } from './pages/kids/KidsNaturPage'
import { KidsPassungPage } from './pages/kids/KidsPassungPage'
import { campusSurfaceEnabled, kidsSurfaceEnabled } from './lib/registrationFlags'
import { EssenPage } from './pages/EssenPage'
import { PrefsPage } from './pages/PrefsPage'
import { MatchPage } from './pages/MatchPage'
import { MehrPage } from './pages/MehrPage'
import { AuthPage } from './pages/AuthPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { MessagesPage } from './pages/MessagesPage'
import { AgbPage } from './pages/legal/AgbPage'
import { DatenschutzPage } from './pages/legal/DatenschutzPage'
import { ImpressumPage } from './pages/legal/ImpressumPage'
import { RankingPage } from './pages/legal/RankingPage'
import { SupportPage } from './pages/legal/SupportPage'
import { isFlagOn, type FeatureFlag } from './lib/flags'
import {
  InnovationPage,
  KatalogPage,
  NewsArchivePage,
  NotFoundPage,
  WissenPage,
} from './pages/HonestRoutes'
import { captureRefFromSearch } from './lib/referral'
import { hydrateSafeTweaks } from './lib/ideas'

const LookPage = lazy(() => import('./pages/LookPage').then((m) => ({ default: m.LookPage })))
const WalletPage = lazy(() => import('./pages/WalletPage').then((m) => ({ default: m.WalletPage })))
const TravelPage = lazy(() => import('./pages/TravelPage').then((m) => ({ default: m.TravelPage })))
const TravelCheckoutPage = lazy(() =>
  import('./pages/TravelCheckoutPage').then((m) => ({ default: m.TravelCheckoutPage })),
)
const SocialPage = lazy(() => import('./pages/SocialPage').then((m) => ({ default: m.SocialPage })))
const FirmaPage = lazy(() => import('./pages/FirmaPage').then((m) => ({ default: m.FirmaPage })))
const MarketplacePage = lazy(() =>
  import('./pages/MarketplacePage').then((m) => ({ default: m.MarketplacePage })),
)
const CreateListingPage = lazy(() =>
  import('./pages/CreateListingPage').then((m) => ({ default: m.CreateListingPage })),
)
const MeinPage = lazy(() => import('./pages/MeinPage').then((m) => ({ default: m.MeinPage })))
const EinstellungPage = lazy(() =>
  import('./pages/EinstellungPage').then((m) => ({ default: m.EinstellungPage })),
)
const InterviewPage = lazy(() => import('./pages/InterviewPage').then((m) => ({ default: m.InterviewPage })))
const PhotoJobsPage = lazy(() => import('./pages/PhotoJobsPage').then((m) => ({ default: m.PhotoJobsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })))
const CompareOffersPage = lazy(() =>
  import('./pages/CompareOffersPage').then((m) => ({ default: m.CompareOffersPage })),
)
const JobsPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const PublicProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.PublicProfilePage })),
)
const ProjectCreatePage = lazy(() =>
  import('./pages/ProjectPage').then((m) => ({ default: m.ProjectCreatePage })),
)
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const ChannelsPage = lazy(() => import('./pages/ChannelsPage').then((m) => ({ default: m.ChannelsPage })))
const IdeenPage = lazy(() => import('./pages/IdeenPage').then((m) => ({ default: m.IdeenPage })))
const IntegrationenPage = lazy(() =>
  import('./pages/IntegrationenPage').then((m) => ({ default: m.IntegrationenPage })),
)
const EmpfehlenPage = lazy(() => import('./pages/EmpfehlenPage').then((m) => ({ default: m.EmpfehlenPage })))
const QuellenPage = lazy(() => import('./pages/QuellenPage').then((m) => ({ default: m.QuellenPage })))
const ErfahrungenPage = lazy(() =>
  import('./pages/ErfahrungenPage').then((m) => ({ default: m.ErfahrungenPage })),
)
const TicketPage = lazy(() => import('./pages/TicketPage').then((m) => ({ default: m.TicketPage })))
const CampusPage = lazy(() => import('./pages/CampusPage').then((m) => ({ default: m.CampusPage })))
const KidsPage = lazy(() => import('./pages/KidsPage').then((m) => ({ default: m.KidsPage })))
const EntdeckerPage = lazy(() => import('./pages/EntdeckerPage').then((m) => ({ default: m.EntdeckerPage })))
const ParkmerkePage = lazy(() => import('./pages/ParkmerkePage').then((m) => ({ default: m.ParkmerkePage })))
const OutfitPage = lazy(() => import('./pages/OutfitPage').then((m) => ({ default: m.OutfitPage })))
const TankenPage = lazy(() => import('./pages/TankenPage').then((m) => ({ default: m.TankenPage })))
const KalenderPage = lazy(() => import('./pages/KalenderPage').then((m) => ({ default: m.KalenderPage })))
const EinkaufszettelPage = lazy(() =>
  import('./pages/EinkaufszettelPage').then((m) => ({ default: m.EinkaufszettelPage })),
)
const AngebotPage = lazy(() =>
  import('./features/offer/AngebotPage').then((m) => ({ default: m.AngebotPage })),
)

function MessagesToSocial() {
  const { threadId } = useParams()
  return <Navigate to={threadId ? `/social/chat/${threadId}` : '/social/chat'} replace />
}

function ChatAlias() {
  const { threadId } = useParams()
  return <Navigate to={threadId ? `/social/chat/${threadId}` : '/social/chat'} replace />
}

export default function App() {
  return (
    <I18nProvider>
      <AppReady />
    </I18nProvider>
  )
}

function AppReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrateSafeTweaks()
    captureRefFromSearch(window.location.search)
    void Promise.all([initRewards(), initStore()]).finally(() => setReady(true))
  }, [])

  if (!ready) return <BootScreen />

  return (
    <AuthProvider>
      <AppUnlockGate>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              element={
                <Suspense fallback={<BootScreen />}>
                  <Outlet />
                </Suspense>
              }
            >
              <Route path="willkommen" element={<ModeChooserPage />} />
              <Route path="willkommen/kids" element={<KidsConsentPage />} />
              <Route path="willkommen/orbit" element={<OrbitRegistrationPage />} />
              <Route index element={<HomePage />} />
              <Route path="freelancer" element={<Navigate to="/" replace />} />
              <Route path="firmen" element={<Navigate to="/firma" replace />} />
              <Route path="material" element={<Navigate to="/marktplatz" replace />} />
              <Route path="transporter" element={<Navigate to="/marktplatz" replace />} />
              <Route path="kuriere" element={<Navigate to="/marktplatz" replace />} />
              <Route path="hotels" element={<Navigate to="/abflug" replace />} />
              <Route path="essen" element={<EssenPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="prefs" element={<PrefsPage />} />
              <Route path="match" element={<MatchPage />} />
              <Route path="treffer" element={<MatchPage />} />
              <Route path="crew" element={<MatchPage />} />
              <Route path="firma" element={<FirmaPage />} />
              <Route path="marktplatz" element={<MarketplacePage />} />
              <Route path="reise" element={<TravelPage />} />
              <Route path="abflug" element={<TravelPage />} />
              <Route path="reise/:offerId" element={<TravelCheckoutPage />} />
              <Route path="abflug/:offerId" element={<TravelCheckoutPage />} />
              <Route path="tickets/:id" element={<TicketPage />} />
              <Route path="social" element={<SocialPage />} />
              <Route path="social/chat" element={<MessagesPage />} />
              <Route path="social/chat/:threadId" element={<MessagesPage />} />
              <Route path="chat" element={<ChatAlias />} />
              <Route path="chat/:threadId" element={<ChatAlias />} />
              <Route path="entdecker" element={<FlagRoute flag="entdecker"><EntdeckerPage /></FlagRoute>} />
              <Route path="quellen" element={<QuellenPage />} />
              <Route path="jobs/compare/:listingId" element={<CompareOffersPage />} />
              <Route path="listings/new" element={<CreateListingPage />} />
              <Route path="listings/:id" element={<ListingDetailPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="mehr" element={<MehrPage />} />
              <Route path="angebot" element={<FlagRoute flag="offerBeta"><AngebotPage /></FlagRoute>} />
              <Route path="parkmerke" element={<ParkmerkePage />} />
              <Route path="outfit" element={<OutfitPage />} />
              <Route path="tanken" element={<TankenPage />} />
              <Route path="kalender" element={<KalenderPage />} />
              <Route path="einkauf" element={<EinkaufszettelPage />} />
              <Route path="campus" element={<CampusSurfaceRoute><CampusPage /></CampusSurfaceRoute>} />
              <Route path="lernen" element={<Navigate to={campusSurfaceEnabled() ? '/campus' : '/'} replace />} />
              <Route path="kids" element={<KidsSurfaceRoute><KidsHubPage /></KidsSurfaceRoute>} />
              <Route path="kids/spiele" element={<KidsSurfaceRoute><KidsSpielePage /></KidsSurfaceRoute>} />
              <Route path="kids/lernen" element={<KidsSurfaceRoute><KidsLernenPage /></KidsSurfaceRoute>} />
              <Route path="kids/hobbies" element={<KidsSurfaceRoute><KidsHobbiesPage /></KidsSurfaceRoute>} />
              <Route path="kids/natur" element={<KidsSurfaceRoute><KidsNaturPage /></KidsSurfaceRoute>} />
              <Route path="kids/passung" element={<KidsSurfaceRoute><KidsPassungPage /></KidsSurfaceRoute>} />
              <Route path="kids/einstellungen" element={<KidsSurfaceRoute><KidsPage /></KidsSurfaceRoute>} />
              <Route path="channels" element={<FlagRoute flag="channels"><ChannelsPage /></FlagRoute>} />
              <Route path="look" element={<FlagRoute flag="kabine"><LookPage /></FlagRoute>} />
              <Route path="kabine" element={<FlagRoute flag="kabine"><LookPage /></FlagRoute>} />
              <Route path="mein" element={<MeinPage />} />
              <Route path="mitentwickeln" element={<MitentwickelnPage />} />
              <Route path="einstellung" element={<EinstellungPage />} />
              <Route path="foto" element={<FlagRoute flag="photoJobs"><PhotoJobsPage /></FlagRoute>} />
              <Route path="interview" element={<FlagRoute flag="interview"><InterviewPage /></FlagRoute>} />
              <Route path="interview/:roomId" element={<FlagRoute flag="interview"><InterviewPage /></FlagRoute>} />
              <Route path="erfahrungen" element={<ErfahrungenPage />} />
              <Route path="wallet" element={<FlagRoute flag="credits"><WalletPage /></FlagRoute>} />
              <Route path="ideen" element={<FlagRoute flag="ideas"><IdeenPage /></FlagRoute>} />
              <Route path="integrationen" element={<FlagRoute flag="integrations"><IntegrationenPage /></FlagRoute>} />
              <Route path="empfehlen" element={<EmpfehlenPage />} />
              <Route path="messages" element={<Navigate to="/social/chat" replace />} />
              <Route path="messages/:threadId" element={<MessagesToSocial />} />
              <Route path="bookings/:id" element={<BookingPage />} />
              <Route path="projects/new" element={<ProjectCreatePage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profiles/:id" element={<PublicProfilePage />} />
              <Route path="katalog" element={<KatalogPage />} />
              <Route path="katalog/*" element={<KatalogPage />} />
              <Route path="innovation" element={<InnovationPage />} />
              <Route path="news" element={<NewsArchivePage />} />
              <Route path="wissen" element={<WissenPage />} />
              <Route path="wissen/*" element={<WissenPage />} />
              <Route path="impressum" element={<ImpressumPage />} />
              <Route path="datenschutz" element={<DatenschutzPage />} />
              <Route path="privacy" element={<DatenschutzPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="agb" element={<AgbPage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </AppUnlockGate>
    </AuthProvider>
  )
}

function FlagRoute({ flag, children }: { flag: FeatureFlag; children: ReactNode }) {
  if (!isFlagOn(flag)) return <Navigate to="/" replace />
  return children
}

function KidsSurfaceRoute({ children }: { children: ReactNode }) {
  if (!kidsSurfaceEnabled()) return <Navigate to="/" replace />
  return children
}

function CampusSurfaceRoute({ children }: { children: ReactNode }) {
  if (!campusSurfaceEnabled()) return <Navigate to="/" replace />
  return children
}

function BootScreen() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-surface">
      <OrbitWordmarkHero />
      <p className="text-sm text-muted">{t('brand.loading')}</p>
    </div>
  )
}
