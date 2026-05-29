'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createUserWorkout, deleteUserWorkout, getUserWorkouts, updateUserWorkout } from '@/lib/db'
import { exerciseLibrary, starterWorkouts } from '@/lib/exercise-data'
import { useApp } from '@/components/providers/app-provider'
import { pickLocalized } from '@/lib/utils'
import { IconCheck, IconDumbbell, IconPlus, IconTrash, IconX } from '@/components/ui/icons'

const lookup = Object.fromEntries(exerciseLibrary.map((exercise) => [exercise.id, exercise]))
const initialBuilder = { id: null, name: '', notes: '', muscleGroup: 'fullBody', location: 'gym', items: [] }

export function WorkoutsScreen() {
  const { t, lang, session, profile, notify, spendToken, openTokenModal } = useApp()
  const [tab, setTab] = useState('starter')
  const [saved, setSaved] = useState([])
  const [builder, setBuilder] = useState(initialBuilder)
  const [saving, setSaving] = useState(false)
  const [activeWorkout, setActiveWorkout] = useState(null)

  useEffect(() => {
    if (!session) return
    getUserWorkouts(session.id).then(({ data }) => setSaved(data || []))
  }, [session])

  const builderExercises = useMemo(() => exerciseLibrary.filter((exercise) => builder.location === 'all' || exercise.location === builder.location), [builder.location])

  const startEditingWorkout = (workout) => {
    setActiveWorkout(null)
    setBuilder({
      id: workout.id,
      name: workout.name,
      notes: workout.notes || '',
      muscleGroup: workout.muscle_group,
      location: workout.location,
      items: workout.items || [],
    })
    setTab('builder')
  }

  const resetBuilder = () => setBuilder(initialBuilder)

  const saveWorkout = async () => {
    if (!session || !builder.name.trim() || builder.items.length === 0) return
    if ((profile?.token_balance ?? 0) <= 0 && !builder.id) {
      openTokenModal()
      return
    }

    setSaving(true)

    if (builder.id) {
      const { data } = await updateUserWorkout(builder.id, builder)
      if (data) {
        setSaved((current) => current.map((item) => item.id === builder.id ? data : item))
        notify(t.workoutSaved)
        resetBuilder()
        setTab('mine')
      }
      setSaving(false)
      return
    }

    const tokenResult = await spendToken('workout save')
    if (tokenResult?.error) {
      setSaving(false)
      return
    }

    const { data } = await createUserWorkout(session.id, builder)
    if (data) {
      setSaved((current) => [data, ...current])
      resetBuilder()
      notify(t.workoutSaved)
      setTab('mine')
    }
    setSaving(false)
  }

  return (
    <div className="page-content page-fade workouts-screen">
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{t.workouts}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{t.workoutBuilderSubtitle}</div>
      </div>

      <div className="pill-tabs">
        {[
          ['starter', t.starterPlans],
          ['builder', t.builder],
          ['mine', t.myWorkouts],
        ].map(([id, label]) => <button key={id} className={`pill-tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === 'starter' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {starterWorkouts.map((workout) => (
            <div key={workout.id} className="card workout-starter-card" style={{ padding: 16 }}>
              <div style={{ height: 3, background: workout.color, borderRadius: 999, marginBottom: 12 }} />
              <div className="workout-starter-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{pickLocalized(workout.names, lang)}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{workout.duration} {t.minsUnit}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{t[workout.level]}</span>
                    <span style={{ fontSize: 11, color: workout.color, fontWeight: 600 }}>{workout.calories} kcal</span>
                  </div>
                </div>
                <div style={{ color: workout.color }}><IconDumbbell size={20} color={workout.color} /></div>
              </div>
              <div className="workout-chip-list">
                {workout.exercises.map((exerciseId) => <span key={exerciseId} className="workout-chip">{pickLocalized(lookup[exerciseId]?.names, lang)}</span>)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'builder' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card workout-builder-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="workout-builder-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{builder.id ? t.editProfile : t.builder}</div>
              {builder.id ? <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={resetBuilder}><IconX size={12} /> {t.cancel}</button> : null}
            </div>
            <input value={builder.name} onChange={(event) => setBuilder((current) => ({ ...current, name: event.target.value }))} placeholder={t.workoutName} />
            <textarea value={builder.notes} onChange={(event) => setBuilder((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder={t.workoutNotes} />
            <div className="grid-2">
              <select value={builder.muscleGroup} onChange={(event) => setBuilder((current) => ({ ...current, muscleGroup: event.target.value }))}>
                {['fullBody', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'].map((item) => <option key={item} value={item}>{t[item]}</option>)}
              </select>
              <select value={builder.location} onChange={(event) => setBuilder((current) => ({ ...current, location: event.target.value }))}>
                <option value="home">{t.home}</option>
                <option value="gym">{t.gym}</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>{t.saveWorkoutHelp}</div>
          </div>
          {builder.items.length > 0 ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{builder.items.length} {t.exercisesSelected}</div>
              {builder.items.map((exerciseId) => (
                <div key={exerciseId} className="metric-row workout-modal-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{pickLocalized(lookup[exerciseId]?.names, lang)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{lookup[exerciseId]?.reps} - {lookup[exerciseId]?.rest}</div>
                  </div>
                  <button onClick={() => setBuilder((current) => ({ ...current, items: current.items.filter((item) => item !== exerciseId) }))} className="btn btn-danger" style={{ padding: '7px 12px' }}>{t.remove}</button>
                </div>
              ))}
              <button className="btn btn-primary" onClick={saveWorkout} disabled={saving || !builder.name.trim() || builder.items.length === 0}>
                {saving ? <><span className="spinner" /> {t.loading}</> : <><IconCheck size={15} /> {t.saveMyWorkout}</>}
              </button>
            </div>
          ) : null}
          <div className="workout-exercise-list">
            {builderExercises.map((exercise) => {
              const selected = builder.items.includes(exercise.id)
              return (
                <button key={exercise.id} className="card workout-builder-card" style={{ borderColor: selected ? 'rgba(0,223,160,.35)' : 'var(--b)', background: selected ? 'rgba(0,223,160,.04)' : 'var(--card)' }} onClick={() => setBuilder((current) => ({ ...current, items: selected ? current.items.filter((item) => item !== exercise.id) : [...current.items, exercise.id] }))}>
                  <div className="workout-builder-item-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="workout-thumb">
                      <Image src={exercise.image} alt={pickLocalized(exercise.names, lang)} width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="workout-card-title" style={{ fontWeight: 700, fontSize: 14 }}>{pickLocalized(exercise.names, lang)}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t[exercise.muscleGroup]} - {pickLocalized(exercise.equipment, lang)}</div>
                      <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{exercise.reps} - {exercise.rest}</div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: selected ? 'var(--em)' : 'var(--card2)', border: `1px solid ${selected ? 'var(--em)' : 'var(--b)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected ? '#040e18' : 'var(--t2)' }}>
                      {selected ? <IconCheck size={14} color="#040e18" /> : <IconPlus size={14} />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {tab === 'mine' ? (
        saved.length === 0 ? (
          <div className="card empty-state">
            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--t2)' }}>{t.noSavedWorkouts}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{t.createFirstWorkout}</div>
          </div>
        ) : (
          <div className="workout-saved-grid">
            {saved.map((workout) => (
              <button key={workout.id} className="card workout-saved-card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }} onClick={() => setActiveWorkout(workout)}>
                <div className="workout-saved-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div className="workout-card-title" style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{workout.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{t[workout.muscle_group]} - {t[workout.location]}</div>
                    {workout.notes ? <div className="workout-card-notes" style={{ fontSize: 12, color: 'var(--t2)', marginTop: 6 }}>{workout.notes}</div> : null}
                  </div>
                  <button onClick={async (event) => { event.stopPropagation(); await deleteUserWorkout(workout.id); setSaved((current) => current.filter((item) => item.id !== workout.id)); if (activeWorkout?.id === workout.id) setActiveWorkout(null) }} className="btn btn-danger" style={{ padding: '7px 10px' }}>
                    <IconTrash size={14} />
                  </button>
                </div>
                <div className="workout-chip-list" style={{ marginTop: 12 }}>
                  {(workout.items || []).map((exerciseId) => <span key={exerciseId} className="workout-chip">{pickLocalized(lookup[exerciseId]?.names, lang)}</span>)}
                </div>
              </button>
            ))}
          </div>
        )
      ) : null}

      {activeWorkout ? (
        <div className="modal-overlay" onClick={() => setActiveWorkout(null)}>
          <div className="card workout-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="workout-modal-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{activeWorkout.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{t[activeWorkout.muscle_group]} - {t[activeWorkout.location]}</div>
              </div>
              <button onClick={() => setActiveWorkout(null)} className="btn btn-secondary" style={{ padding: '7px 10px' }}><IconX size={14} /></button>
            </div>
            {activeWorkout.notes ? <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>{activeWorkout.notes}</div> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {(activeWorkout.items || []).map((exerciseId) => (
                <div key={exerciseId} className="metric-row workout-modal-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{pickLocalized(lookup[exerciseId]?.names, lang)}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{lookup[exerciseId]?.reps} - {lookup[exerciseId]?.rest}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t2)' }}>{pickLocalized(lookup[exerciseId]?.equipment, lang)}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => startEditingWorkout(activeWorkout)}><IconCheck size={14} /> {t.editProfile}</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

