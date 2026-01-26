export interface CompanyBasics {
  inn?: string | null
  name?: string | null
}

const normalize = (value?: string | null) => (value ?? "").trim()

export const getMissingCompanyBasics = (company?: CompanyBasics | null) => {
  const missing: string[] = []

  if (!normalize(company?.inn)) {
    missing.push("ИНН")
  }

  if (!normalize(company?.name)) {
    missing.push("полное наименование")
  }

  return missing
}

export const getCompanyBasicsError = (company?: CompanyBasics | null) => {
  const missing = getMissingCompanyBasics(company)
  if (missing.length === 0) return null

  if (missing.length === 1) {
    return `Для создания заявки заполните ${missing[0]}.`
  }

  return `Для создания заявки заполните ${missing.join(" и ")}.`
}
