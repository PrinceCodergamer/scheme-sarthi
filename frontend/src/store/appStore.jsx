import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [lang, setLang] = useState('hi')
  const [profile, setProfile] = useState(null)
  const [profileId, setProfileId] = useState(null)
  const [scanResults, setScanResults] = useState(null)
  const [applications, setApplications] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState('welcome')
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const t = useCallback((key, params = {}) => {
    try {
      const trans = lang === 'hi'
        ? { "app.name": "योजना सारथी", "app.tagline": "जो आपका हक़ है, वो छूटने न दें", "app.tagline.en": "Never lose what's rightfully yours", "app.start": "शुरू करें", "app.load_demo": "Load demo profile (Mohan)", "app.data_badge": "आपका डेटा आपके पास", "app.dpdp": "DPPD compliant", "app.free": "100% निःशुल्क", "nav.home": "होम", "nav.schemes": "मेरी योजनाएँ", "nav.applications": "आवेदन", "nav.reminders": "रिमाइंडर", "profiler.title": "आपकी प्रोफ़ाइल", "profiler.progress": "{current}/{total}", "profiler.next": "अगला", "profiler.back": "वापस", "profiler.done": "जाँच शुरू करें", "profiler.age": "आपकी उम्र कितनी है?", "profiler.gender": "आपका लिंग?", "profiler.state": "आप किस राज्य में रहते हैं?", "profiler.district": "आपका ज़िला?", "profiler.occupation": "आप क्या करते हैं?", "profiler.land": "क्या आपके पास खेती की ज़मीन है?", "profiler.land_acres": "कितने एकड़ ज़मीन है?", "profiler.income": "आपकी वार्षिक आय कितनी है?", "profiler.schemes": "आप इनमें से किन योजनाओं में पंजीकृत हैं?", "profiler.last_payment": "इस योजना से अंतिम भुगतान कब मिला था?", "profiler.bank_change": "क्या हाल ही में आपने बैंक खाता बदला है?", "gender.male": "पुरुष", "gender.female": "महिला", "gender.other": "अन्य", "occ.farmer": "किसान 🌾", "occ.student": "विद्यार्थी 📚", "occ.worker": "मज़दूर 🔧", "occ.senior": "वरिष्ठ नागरिक 👴", "state.up": "उत्तर प्रदेश", "state.bihar": "बिहार", "state.mp": "मध्य प्रदेश", "state.rajasthan": "राजस्थान", "state.maharashtra": "महाराष्ट्र", "state.delhi": "दिल्ली", "state.tn": "तमिलनाडु", "state.karnataka": "कर्नाटक", "state.gujarat": "गुजरात", "state.wb": "पश्चिम बंगाल", "state.odisha": "ओडिशा", "state.ap": "आंध्र प्रदेश", "income.0-50000": "₹0 – ₹50,000", "income.50000-100000": "₹50,000 – ₹1,00,000", "income.100000-200000": "₹1,00,000 – ₹2,00,000", "income.200000-500000": "₹2,00,000 – ₹5,00,000", "income.500000+": "₹5,00,000 से अधिक", "yes": "हाँ", "no": "नहीं", "acres": "एकड़", "select_all": "सभी चुनें", "deselect_all": "सब हटाएँ", "select_date": "तिथि चुनें", "scan.title": "आपकी योजनाएँ जाँची जा रही हैं…", "scan.match": "3,000+ योजनाओं से मिलान…", "scan.analyze": "आपकी जानकारी का विश्लेषण…", "scan.detect": "लैप्स और जोखिम का पता लगाया जा रहा है…", "result.greeting": "{name} जी, आपको ₹{amount}/वर्ष का लाभ वापस मिल सकता है", "result.lapsed": "लैप्स हो गई", "result.at_risk": "जोखिम में", "result.eligible": "पात्र — आवेदन करें", "result.not_eligible": "पात्र नहीं", "result.fix": "ठीक करें →", "result.apply": "आवेदन करें →", "result.per_year": "/वर्ष", "result.per_month": "/माह", "revival.what_wrong": "क्या गलत हुआ?", "revival.steps": "ठीक करने के चरण", "revival.fill_form": "फ़ॉर्म भरें", "revival.documents": "आवश्यक दस्तावेज़", "revival.submit_at": "कहाँ जमा करें", "revival.download_pdf": "PDF डाउनलोड करें", "revival.apply_online": "ऑनलाइन आवेदन करें", "revival.csc": "निकटतम CSC केंद्र", "revival.submit": "आवेदन जमा करें", "tracker.submitted": "आवेदन किया", "tracker.verified": "सत्यापित", "tracker.block_office": "ब्लॉक कार्यालय में", "tracker.sanctioned": "स्वीकृत", "tracker.restored": "लाभ बहाल", "tracker.advance": "अगले चरण पर जाएँ →", "tracker.congrats": "बधाई! आपका लाभ बहाल हो गया है 🎉", "reminder.title": "आपके रिमाइंडर", "reminder.days_left": "{days} दिन शेष", "reminder.days_overdue": "{days} दिन अतिदेय", "reminder.simulate": "Simulate reminder", "reminder.sent": "सूचना भेजी गई!", "empty.no_lapsed": "कोई लैप्स योजना नहीं! 🎉", "empty.no_at_risk": "कोई जोखिम नहीं!", "empty.no_eligible": "अभी कोई पात्र योजना नहीं", "empty.no_applications": "अभी तक कोई आवेदन नहीं", "empty.no_reminders": "कोई रिमाइंडर नहीं", "empty.applications_desc": "जब आप किसी योजना को ठीक करेंगे, तो आवेदन यहाँ दिखेंगे", "lang.hi": "हिंदी", "lang.en": "English" }
        : { "app.name": "Scheme Sarthi", "app.tagline": "जो आपका हक़ है, वो छूटने न दें", "app.tagline.en": "Never lose what's rightfully yours", "app.start": "Get Started", "app.load_demo": "Load demo profile (Mohan)", "app.data_badge": "Your data stays with you", "app.dpdp": "DPDP compliant", "app.free": "100% Free", "nav.home": "Home", "nav.schemes": "My Schemes", "nav.applications": "Applications", "nav.reminders": "Reminders", "profiler.title": "Your Profile", "profiler.progress": "{current}/{total}", "profiler.next": "Next", "profiler.back": "Back", "profiler.done": "Start Scan", "profiler.age": "What is your age?", "profiler.gender": "What is your gender?", "profiler.state": "Which state do you live in?", "profiler.district": "Your district?", "profiler.occupation": "What do you do?", "profiler.land": "Do you own agricultural land?", "profiler.land_acres": "How many acres?", "profiler.income": "What is your annual income?", "profiler.schemes": "Which schemes are you enrolled in?", "profiler.last_payment": "When was your last payment from this scheme?", "profiler.bank_change": "Have you changed your bank account recently?", "gender.male": "Male", "gender.female": "Female", "gender.other": "Other", "occ.farmer": "Farmer 🌾", "occ.student": "Student 📚", "occ.worker": "Worker 🔧", "occ.senior": "Senior Citizen 👴", "state.up": "Uttar Pradesh", "state.bihar": "Bihar", "state.mp": "Madhya Pradesh", "state.rajasthan": "Rajasthan", "state.maharashtra": "Maharashtra", "state.delhi": "Delhi", "state.tn": "Tamil Nadu", "state.karnataka": "Karnataka", "state.gujarat": "Gujarat", "state.wb": "West Bengal", "state.odisha": "Odisha", "state.ap": "Andhra Pradesh", "income.0-50000": "₹0 – ₹50,000", "income.50000-100000": "₹50,000 – ₹1,00,000", "income.100000-200000": "₹1,00,000 – ₹2,00,000", "income.200000-500000": "₹2,00,000 – ₹5,00,000", "income.500000+": "₹5,00,000+", "yes": "Yes", "no": "No", "acres": "acres", "select_all": "Select All", "deselect_all": "Deselect All", "select_date": "Select Date", "scan.title": "Scanning your schemes…", "scan.match": "Matching with 3,000+ schemes…", "scan.analyze": "Analyzing your profile…", "scan.detect": "Detecting lapses and risks…", "result.greeting": "{name}, you can recover ₹{amount}/year in benefits", "result.lapsed": "Lapsed", "result.at_risk": "At Risk", "result.eligible": "Eligible — Apply Now", "result.not_eligible": "Not Eligible", "result.fix": "Fix this →", "result.apply": "Apply Now →", "result.per_year": "/year", "result.per_month": "/month", "revival.what_wrong": "What went wrong?", "revival.steps": "Fix Steps", "revival.fill_form": "Fill Form", "revival.documents": "Required Documents", "revival.submit_at": "Where to Submit", "revival.download_pdf": "Download PDF", "revival.apply_online": "Apply Online", "revival.csc": "Nearest CSC Center", "revival.submit": "Submit Application", "tracker.submitted": "Submitted", "tracker.verified": "Verified", "tracker.block_office": "At Block Office", "tracker.sanctioned": "Sanctioned", "tracker.restored": "Benefit Restored", "tracker.advance": "Advance to Next Stage →", "tracker.congrats": "Congratulations! Your benefit has been restored 🎉", "reminder.title": "Your Reminders", "reminder.days_left": "{days} days left", "reminder.days_overdue": "{days} days overdue", "reminder.simulate": "Simulate reminder", "reminder.sent": "Notification sent!", "empty.no_lapsed": "No lapsed schemes! 🎉", "empty.no_at_risk": "Nothing at risk!", "empty.no_eligible": "No eligible schemes currently", "empty.no_applications": "No applications yet", "empty.no_reminders": "No reminders", "empty.applications_desc": "When you fix a scheme, applications will appear here", "lang.hi": "हिंदी", "lang.en": "English" }
      let val = trans[key] || key
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v)
      })
      return val
    } catch {
      return key
    }
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang(l => l === 'hi' ? 'en' : 'hi')
  }, [])

  const apiUrl = '/api'

  const fetchProfile = useCallback(async (id) => {
    const res = await fetch(`${apiUrl}/profile/${id}`)
    if (!res.ok) throw new Error('Profile not found')
    const data = await res.json()
    setProfile(data)
    setProfileId(id)
    return data
  }, [])

  const loadDemoProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/profile/demo`, { method: 'POST' })
      const data = await res.json()
      if (data.profile) {
        data.profile.bank_account_changed = Boolean(data.profile.bank_account_changed)
        data.profile.land_owner = Boolean(data.profile.land_owner)
      }
      setProfile(data.profile)
      setProfileId(data.profile_id)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const createProfile = useCallback(async (profileData) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      const data = await res.json()
      setProfileId(data.profile_id)
      setProfile({ id: data.profile_id, ...profileData })
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const addEnrollments = useCallback(async (enrollments) => {
    if (!profileId) return
    const res = await fetch(`${apiUrl}/profile/${profileId}/enrollments/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollments)
    })
    return res.json()
  }, [profileId])

  const runScan = useCallback(async () => {
    if (!profileId) return
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/profile/${profileId}/scan`)
      const data = await res.json()
      setScanResults(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [profileId])

  const applyScheme = useCallback(async (schemeId, formData = {}) => {
    if (!profileId) return
    const res = await fetch(`${apiUrl}/profile/${profileId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheme_id: schemeId, form_data: formData })
    })
    const data = await res.json()
    fetchApplications()
    return data
  }, [profileId])

  const fetchApplications = useCallback(async () => {
    if (!profileId) return
    const res = await fetch(`${apiUrl}/profile/${profileId}/applications`)
    const data = await res.json()
    setApplications(data)
    return data
  }, [profileId])

  const advanceApplication = useCallback(async (appId) => {
    const res = await fetch(`${apiUrl}/applications/${appId}/advance`, { method: 'POST' })
    const data = await res.json()
    fetchApplications()
    return data
  }, [])

  const fetchReminders = useCallback(async () => {
    if (!profileId) return
    const res = await fetch(`${apiUrl}/profile/${profileId}/reminders`)
    const data = await res.json()
    setReminders(data)
    return data
  }, [profileId])

  const value = {
    lang, setLang, toggleLang,
    profile, setProfile,
    profileId, setProfileId,
    scanResults, setScanResults,
    applications, setApplications,
    reminders, setReminders,
    loading, setLoading,
    page, setPage,
    whatsappPhone, setWhatsappPhone,
    t,
    fetchProfile, loadDemoProfile, createProfile,
    addEnrollments, runScan,
    applyScheme, fetchApplications, advanceApplication,
    fetchReminders,
    apiUrl
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
