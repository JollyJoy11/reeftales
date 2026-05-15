async function searchWorms(req, res) {
  const name = req.query.name?.trim()

  if (!name) {
    return res.status(400).json({ message: 'Species name is required' })
  }

  try {
    const endpoint = new URL(
      `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(name)}`
    )

    endpoint.searchParams.set('like', 'true')
    endpoint.searchParams.set('marine_only', 'true')

    const response = await fetch(endpoint)

    if (!response.ok) {
      return res.status(response.status).json({ message: 'WoRMS lookup failed' })
    }

    const records = await response.json()

    res.json(
      records.slice(0, 5).map((record) => ({
        aphiaId: record.AphiaID,
        scientificName: record.scientificname,
        acceptedName: record.valid_name,
        authority: record.authority,
        status: record.status,
        rank: record.rank,
        kingdom: record.kingdom,
        phylum: record.phylum,
        className: record.class,
        family: record.family,
        wormsUrl: record.url
      }))
    )
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to search WoRMS' })
  }
}

module.exports = {
  searchWorms
}
