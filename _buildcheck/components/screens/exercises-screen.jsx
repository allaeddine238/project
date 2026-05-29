'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { exerciseLibrary, muscleGroups } from '@/lib/exercise-data'
import { pickLocalized } from '@/lib/utils'
import { IconSearch } from '@/components/ui/icons'

export function ExercisesScreen() {
  const { t, lang } = useApp()
  const [location, setLocation] = useState('all')
  const [group, setGroup] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => exerciseLibrary.filter((exercise) => {
    const matchesLocation = location === 'all' || exercise.location === location
    const matchesGroup = group === 'all' || exercise.muscleGroup === group
    const searchText = [pickLocalized(exercise.names, lang), pickLocalized(exercise.equipment, lang), pickLocalized(exercise.notes, lang)].join(' ').toLowerCase()
    const matchesSearch = searchText.includes(search.toLowerCase())
    return matchesLocation && matchesGroup && matchesSearch
  }), [group, lang, location, search])

  const grouped = useMemo(() => filtered.reduce((accumulator, exercise) => {
    accumulator[exercise.muscleGroup] = [...(accumulator[exercise.muscleGroup] || []), exercise]
    return accumulator
  }, {}), [filtered])

  return (
    <div className="page-content page-fade">
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{t.exerciseLibrary}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{t.exerciseLibrarySubtitle}</div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}><IconSearch size={15} /></div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchExercises} style={{ paddingLeft: 36 }} />
      </div>

      <div className="pill-tabs">
        {['all', 'home', 'gym'].map((item) => (
          <button key={item} className={`pill-tab${location === item ? ' active' : ''}`} onClick={() => setLocation(item)}>{t[item]}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {muscleGroups.map((item) => (
          <button key={item} onClick={() => setGroup(item)} style={{ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', background: group === item ? 'var(--em)' : 'var(--card2)', color: group === item ? '#040e18' : 'var(--t2)', fontSize: 12, fontWeight: 600, border: group === item ? 'none' : '1px solid var(--b)' }}>{t[item]}</button>
        ))}
      </div>

      {filtered.length === 0 ? <div className="card empty-state"><div style={{ color: 'var(--t2)', fontWeight: 500 }}>{t.noMatches}</div></div> : null}

      {Object.entries(grouped).map(([muscleGroup, items]) => (
        <div key={muscleGroup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="section-title">{t[muscleGroup]}</div>
          {items.map((exercise) => (
            <div key={exercise.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <div style={{ width: 104, minWidth: 104, borderRadius: 12, overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--b)' }}>
                  <Image src={exercise.image} alt={pickLocalized(exercise.names, lang)} width={104} height={104} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{pickLocalized(exercise.names, lang)}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t[exercise.muscleGroup]} · {pickLocalized(exercise.equipment, lang)}</div>
                    </div>
                    <span className={`badge ${exercise.location === 'home' ? 'badge-green' : 'badge-amber'}`}>{exercise.location === 'home' ? t.recommendedHome : t.recommendedGym}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-green">{exercise.reps}</span>
                    <span className="badge badge-amber">{exercise.rest}</span>
                    <span className="badge badge-red">{t[exercise.level]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{pickLocalized(exercise.notes, lang)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
