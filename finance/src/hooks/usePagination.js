import { useState, useMemo, useEffect } from 'react'

export default function usePagination(data, perPage = 8) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [data.length, totalPages, page])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return data.slice(start, start + perPage)
  }, [data, page, perPage])

  return { page, setPage, totalPages, paginated, total: data.length, perPage }
}
