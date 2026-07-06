import { useState } from 'react'
import './App.css'
import { CardEditorDialog } from './components/CardEditorDialog.jsx'
import { FloatingControls } from './components/FloatingControls.jsx'
import { Header } from './components/Header.jsx'
import { ImportDialog } from './components/ImportDialog.jsx'
import { ProgressBadges } from './components/ProgressBadges.jsx'
import { SettingsDialog } from './components/SettingsDialog.jsx'
import { SourceDialog } from './components/SourceDialog.jsx'
import { StudyPanel } from './components/StudyPanel.jsx'
import { labels } from './constants/appConstants.js'
import { deckData } from './data/cards.js'
import { useCardEditor } from './hooks/useCardEditor.js'
import { useCardQueue } from './hooks/useCardQueue.js'
import { useDarkMode } from './hooks/useDarkMode.js'
import { useImportFlow } from './hooks/useImportFlow.js'
import { usePersistedState } from './hooks/usePersistedState.js'
import { useStudyActions } from './hooks/useStudyActions.js'

function App() {
  const [state, setState] = usePersistedState()
  const [sourceOpen, setSourceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingFocusCardId, setPendingFocusCardId] = useState(null)
  const { darkMode, toggleDarkMode } = useDarkMode()
  const {
    allCards,
    cardsByType,
    changeLevel,
    changeQuota,
    changeType,
    currentCard,
    currentDay,
    currentIndex,
    dueCount,
    dueNow,
    freshAllowed,
    getReview,
    isDue,
    isNew,
    learnedTodayCount,
    masteredCount,
    queue,
    setCurrentIndex,
    setShowingAnswer,
    showingAnswer,
    streak,
  } = useCardQueue({ state, setState, pendingFocusCardId, setPendingFocusCardId })
  const {
    editorDraft,
    editorMode,
    editorOpen,
    openCardEditor,
    saveEditorCard,
    setEditorDraft,
    setEditorOpen,
  } = useCardEditor({
    currentCard,
    selectedLevel: state.selectedLevel,
    selectedType: state.selectedType,
    setCurrentIndex,
    setPendingFocusCardId,
    setShowingAnswer,
    setState,
  })
  const {
    autoTranslateRows,
    buildImportPreview,
    importOpen,
    importRows,
    importSelectedRows,
    importText,
    isTranslating,
    setImportOpen,
    setImportText,
    translationError,
    updateImportRow,
  } = useImportFlow({
    allCards,
    setCurrentIndex,
    setPendingFocusCardId,
    setShowingAnswer,
    setState,
  })

  const { deleteCurrentCard, resetProgress, reviewCard } = useStudyActions({
    currentCard,
    currentDay,
    getReview,
    isNew,
    setCurrentIndex,
    setShowingAnswer,
    setState,
  })

  return (
    <main className="app-shell">
      <Header currentDay={currentDay} dueCount={dueCount} />

      <ProgressBadges
        learnedTodayCount={learnedTodayCount}
        masteredCount={masteredCount}
        quotas={state.quotas}
        streak={streak}
      />

      <div className="study-center">
        <StudyPanel
          currentCard={currentCard}
          currentIndex={currentIndex}
          deleteCurrentCard={deleteCurrentCard}
          dueNow={dueNow}
          freshAllowed={freshAllowed}
          getReview={getReview}
          isDue={isDue}
          isNew={isNew}
          labels={labels}
          openCardEditor={openCardEditor}
          queue={queue}
          resetProgress={resetProgress}
          reviewCard={reviewCard}
          selectedType={state.selectedType}
          setCurrentIndex={setCurrentIndex}
          setShowingAnswer={setShowingAnswer}
          showingAnswer={showingAnswer}
        />
      </div>

      {sourceOpen && <SourceDialog onClose={() => setSourceOpen(false)} sources={deckData.sources} />}

      {settingsOpen && (
        <SettingsDialog
          changeLevel={changeLevel}
          changeQuota={changeQuota}
          changeType={changeType}
          generatedAt={deckData.generatedAt}
          labels={labels}
          onClose={() => setSettingsOpen(false)}
          onImportOpen={() => {
            setSettingsOpen(false)
            setImportOpen(true)
          }}
          onSourceOpen={() => {
            setSettingsOpen(false)
            setSourceOpen(true)
          }}
          open={settingsOpen}
          quotas={state.quotas}
          selectedLevel={state.selectedLevel}
          selectedType={state.selectedType}
          sourceCount={deckData.sources.length}
          totalCards={deckData.summary.total}
        />
      )}

      {editorOpen && (
        <CardEditorDialog
          editorDraft={editorDraft}
          editorMode={editorMode}
          onClose={() => setEditorOpen(false)}
          onDraftChange={(field, value) => setEditorDraft((draft) => ({ ...draft, [field]: value }))}
          onSubmit={saveEditorCard}
        />
      )}

      {importOpen && (
        <ImportDialog
          autoTranslateRows={autoTranslateRows}
          buildImportPreview={buildImportPreview}
          importRows={importRows}
          importSelectedRows={importSelectedRows}
          importText={importText}
          isTranslating={isTranslating}
          onClose={() => setImportOpen(false)}
          setImportText={setImportText}
          translationError={translationError}
          updateImportRow={updateImportRow}
        />
      )}

      <FloatingControls
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        settingsOpen={settingsOpen}
        onSettingsToggle={() => setSettingsOpen((open) => !open)}
      />
    </main>
  )
}

export default App
