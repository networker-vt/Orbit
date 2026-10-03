import { useEffect, useState } from 'react'
import {
  OCCUPATION_GROUPS,
  occupationByLabel,
  occupationsInGroup,
  occupationText,
  groupText,
} from '../../data/occupations'
import { useI18n } from '../../lib/i18n'
import { Input, Select } from '../ui/Input'

export function JobSelect({
  label,
  value,
  onChange,
  allowCustom = true,
  allowEmpty = true,
  showHint = true,
  emptyLabel,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  allowCustom?: boolean
  allowEmpty?: boolean
  showHint?: boolean
  emptyLabel?: string
}) {
  const { resolved, t } = useI18n()
  const known = Boolean(value && occupationByLabel(value))
  const [custom, setCustom] = useState(known || !value ? '' : value)

  useEffect(() => {
    setCustom(occupationByLabel(value) || !value ? '' : value)
  }, [value])

  return (
    <div className="space-y-2" data-job-select="1">
      <Select
        label={label}
        value={known ? value : ''}
        onChange={(e) => {
          setCustom('')
          onChange(e.target.value)
        }}
      >
        {allowEmpty && <option value="">{emptyLabel ?? t('job.empty')}</option>}
        {OCCUPATION_GROUPS.map((group) => (
          <optgroup key={group.id} label={groupText(group.id, resolved)}>
            {occupationsInGroup(group.id).map((job) => (
              <option key={job.id} value={job.de}>
                {occupationText(job, resolved)}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      {allowCustom && (
        <Input
          label={t('job.custom')}
          value={custom}
          placeholder={t('job.customPh')}
          onChange={(e) => {
            const next = e.target.value
            setCustom(next)
            onChange(next.trim())
          }}
        />
      )}
      {showHint && <p className="text-xs text-muted">{t('job.hint')}</p>}
    </div>
  )
}
