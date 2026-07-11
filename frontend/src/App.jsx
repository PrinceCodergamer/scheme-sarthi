import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from './store/appStore'
import LanguageToggle from './components/LanguageToggle'
import BottomNav from './components/BottomNav'
import WelcomePage from './pages/WelcomePage'
import ProfilerPage from './pages/ProfilerPage'
import ScanningPage from './pages/ScanningPage'
import ResultsPage from './pages/ResultsPage'
import RevivalPage from './pages/RevivalPage'
import ApplicationsPage from './pages/ApplicationsPage'
import RemindersPage from './pages/RemindersPage'
import AadhaarPage from './pages/AadhaarPage'
import AadhaarFollowupPage from './pages/AadhaarFollowupPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AICopilot from './components/AICopilot'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
}

const pageTransition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
  duration: 0.25,
}

function PageWrapper({ children, pageKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { page, setPage, profileId, lang } = useApp()
  const [revivalSchemeId, setRevivalSchemeId] = useState(null)

  const showBottomNav = page !== 'welcome' && page !== 'profiler' && page !== 'scanning' && page !== 'admin'

  const handleSetPage = useCallback((newPage, params) => {
    if (newPage === 'revival' && params?.schemeId) {
      setRevivalSchemeId(params.schemeId)
    }
    setPage(newPage)
  }, [setPage])

  const handleBackFromRevival = useCallback(() => {
    setPage('results')
  }, [setPage])

  const handlePageChange = useCallback((newPage) => {
    if (newPage === 'results' || newPage === 'schemes') {
      setPage('results')
    } else if (newPage === 'applications') {
      setPage('applications')
    } else if (newPage === 'reminders') {
      setPage('reminders')
    } else {
      setPage(newPage)
    }
  }, [setPage])

  return (
    <div className="phone-frame">
      <div className="tricolor-strip" />

      <div className="flex items-center justify-between px-4 py-2 pt-3" style={{ paddingTop: '12px' }}>
        <div />
        <LanguageToggle />
      </div>

      <div className={showBottomNav ? 'pb-20' : ''}>
        <PageWrapper pageKey={page}>
          {page === 'welcome' && <WelcomePage />}
          {page === 'aadhaar' && <AadhaarPage />}
          {page === 'aadhaar_followup' && <AadhaarFollowupPage />}
          {page === 'admin' && <AdminDashboard />}
          {page === 'profiler' && <ProfilerPage />}
          {page === 'scanning' && <ScanningPage />}
          {page === 'results' && <ResultsPage />}
          {page === 'revival' && (
            <RevivalPage
              schemeId={revivalSchemeId}
              onBack={handleBackFromRevival}
            />
          )}
          {page === 'applications' && <ApplicationsPage />}
          {page === 'reminders' && <RemindersPage />}
          {page === 'schemes' && <ResultsPage />}
        </PageWrapper>
      </div>

      {showBottomNav && <BottomNav />}
      <AICopilot />
    </div>
  )
}
