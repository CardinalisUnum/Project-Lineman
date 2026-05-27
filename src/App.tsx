import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Send, 
  MessageSquare, 
  History, 
  Settings, 
  RefreshCw, 
  Compass, 
  Shield, 
  User, 
  FileText, 
  FileCode, 
  Check, 
  Trash2, 
  Mail, 
  ThumbsUp, 
  ChevronRight, 
  HelpCircle, 
  Search, 
  Info,
  Server,
  Filter
} from "lucide-react";
import { 
  CommunityReport, 
  SocialFeedItem, 
  UserPrefs, 
  ServiceType, 
  OutageStatus 
} from "./types";
import { 
  METRO_MANILA_LOCATIONS, 
  INITIAL_REPORTS, 
  INITIAL_SOCIAL_FEED, 
  findClosestBarangay, 
  generateMockDiagnostics 
} from "./mockData";

// --- CUSTOM LEAFLET WRAPPER COMPONENT ---
interface MapProps {
  reports: CommunityReport[];
  selectedReport: CommunityReport | null;
  onSelectReport: (report: CommunityReport) => void;
}

const LeafletMap: React.FC<MapProps> = ({ reports, selectedReport, onSelectReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Initialize map instance once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [14.5995, 120.9842],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      // Use a premium Dark theme tile layer from CartoDB
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Plot markers
    reports.forEach((rep) => {
      let markerColor = "bg-emerald-500 shadow-emerald-500/50";
      if (rep.status === "Outage") {
        markerColor = "bg-rose-500 shadow-rose-500/50 animate-pulse";
      } else if (rep.status === "Degraded") {
        markerColor = "bg-amber-500 shadow-amber-500/50";
      } else if (rep.status === "Maintenance") {
        markerColor = "bg-blue-500 shadow-blue-500/50";
      }

      // Create a clean custom pulsing circle indicator as marker icon
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-6 h-6 group">
            <div class="absolute w-4 h-4 rounded-full ${markerColor} border-2 border-[#0c0f17] transition-all group-hover:scale-125"></div>
            <div class="absolute w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        `,
        className: "custom-leaflet-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(rep.coordinates, { icon: customIcon }).addTo(map);

      // Create interactive popup template with responsive action trigger
      const popupContent = `
        <div class="text-[#0c0f17] font-sans p-1 min-w-[210px] select-none">
          <div class="flex items-center justify-between gap-2 mb-1.5 border-b border-gray-100 pb-1">
            <span class="font-bold text-xs tracking-tight text-gray-900">${rep.service}</span>
            <span class="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded ${
              rep.status === "Outage" ? "bg-rose-100 text-rose-700" :
              rep.status === "Degraded" ? "bg-amber-100 text-amber-700" :
              rep.status === "Maintenance" ? "bg-blue-100 text-blue-700" :
              "bg-emerald-100 text-emerald-700"
            }">${rep.status}</span>
          </div>
          <div class="text-[10px] text-gray-500 font-semibold mb-1 flex items-center gap-0.5">
            📍 ${rep.location}
          </div>
          <p class="text-[11px] text-gray-700 italic border-l-2 border-slate-300 pl-1.5 my-1.5 leading-relaxed bg-slate-50 p-1 rounded">
            "${rep.notes.length > 80 ? rep.notes.substring(0, 80) + '...' : rep.notes}"
          </p>
          <div class="flex justify-between items-center text-[9px] text-gray-400 mt-2 font-medium">
            <span>By: ${rep.reporter}</span>
            <span class="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-black">${rep.verifications} reports</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Select report on click
      marker.on("click", () => {
        onSelectReport(rep);
      });

      markersRef.current.push(marker);
    });

  }, [reports, onSelectReport]);

  // Adjust view when report is selected from lists
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !selectedReport) return;

    mapInstanceRef.current.setView(selectedReport.coordinates, 13, {
      animate: true,
      duration: 1.2
    });

    // Find marker and open its popup
    const targetIdx = reports.findIndex(r => r.id === selectedReport.id);
    if (targetIdx !== -1 && markersRef.current[targetIdx]) {
      setTimeout(() => {
        if (markersRef.current[targetIdx]) {
          markersRef.current[targetIdx].openPopup();
        }
      }, 300);
    }
  }, [selectedReport]);

  return (
    <div className="relative w-full h-[320px] md:h-[420px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ outline: "none" }} />
      
      {/* Static Legend Block */}
      <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[10px] text-gray-300 tracking-wide backdrop-blur-md z-[1000] shadow-md select-none pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Widespread Outage (🔴)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Degraded Service (🟡)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Maintenance Node (🔧)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Normal Link (🟢)</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- CORE APPLICATION COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "social" | "report" | "history">("dashboard");
  
  // Storage States
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [socialFeed, setSocialFeed] = useState<SocialFeedItem[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPrefs>({
    defaultLocation: "Makati, Bel-Air",
    consentGiven: false,
    emailCCs: ["lpnjaso@mymail.mapua.edu.ph", "help@pldt.com", "complaints@dict.gov.ph"]
  });

  // UI Interactive States
  const [selectedCity, setSelectedCity] = useState<string>("Makati");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("Bel-Air");
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  
  // Reporting Form States
  const [reportService, setReportService] = useState<ServiceType>("PLDT Fiber");
  const [reportCity, setReportCity] = useState<string>("Makati");
  const [reportBarangay, setReportBarangay] = useState<string>("Bel-Air");
  const [reportDuration, setReportDuration] = useState<string>("1-2 hours");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [reportReporter, setReportReporter] = useState<string>("");
  const [attachDiagnostics, setAttachDiagnostics] = useState<boolean>(false);
  const [diagnosticContent, setDiagnosticContent] = useState<string>("");
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Search Filters
  const [feedSearch, setFeedSearch] = useState<string>("");
  const [dashboardSearch, setDashboardSearch] = useState<string>("");

  // Load and seed database from LocalStorage
  useEffect(() => {
    const localReps = localStorage.getItem("netpulse_reports");
    const localSocial = localStorage.getItem("netpulse_social");
    const localPrefs = localStorage.getItem("netpulse_prefs");

    if (localReps) {
      setReports(JSON.parse(localReps));
    } else {
      localStorage.setItem("netpulse_reports", JSON.stringify(INITIAL_REPORTS));
      setReports(INITIAL_REPORTS);
    }

    if (localSocial) {
      setSocialFeed(JSON.parse(localSocial));
    } else {
      localStorage.setItem("netpulse_social", JSON.stringify(INITIAL_SOCIAL_FEED));
      setSocialFeed(INITIAL_SOCIAL_FEED);
    }

    if (localPrefs) {
      setUserPrefs(JSON.parse(localPrefs));
    } else {
      localStorage.setItem("netpulse_prefs", JSON.stringify(userPrefs));
    }
  }, []);

  // Update localStorage when lists change
  const saveReportsToStorage = (updatedReps: CommunityReport[]) => {
    localStorage.setItem("netpulse_reports", JSON.stringify(updatedReps));
    setReports(updatedReps);
  };

  const saveSocialToStorage = (updatedSocial: SocialFeedItem[]) => {
    localStorage.setItem("netpulse_social", JSON.stringify(updatedSocial));
    setSocialFeed(updatedSocial);
  };

  // Synchronise diagnostic generator template with current form inputs
  useEffect(() => {
    if (attachDiagnostics) {
      const compiled = generateMockDiagnostics(reportService, `${reportCity}, ${reportBarangay}`);
      setDiagnosticContent(compiled);
    } else {
      setDiagnosticContent("");
    }
  }, [attachDiagnostics, reportService, reportCity, reportBarangay]);

  // Periodic simulated live notification feeder (to represent standard socket servers)
  useEffect(() => {
    const handleNewsFeedSimulation = () => {
      // Pick a random city & barangay
      const randomCityObj = METRO_MANILA_LOCATIONS[Math.floor(Math.random() * METRO_MANILA_LOCATIONS.length)];
      const randomBrgyObj = randomCityObj.barangays[Math.floor(Math.random() * randomCityObj.barangays.length)];
      
      const platforms: ("twitter" | "facebook" | "reddit")[] = ["twitter", "reddit", "facebook"];
      const authors = ["PH_User_309", "netizen_manila", "kape_coder", "pinoy_gamer", "reklamo_queen", "marites_alert"];
      const messages = [
        `Grabe naman PLDT sa ${randomBrgyObj.name}, kanina pa naglo-looping yung red light ng wifi. No connection again!`,
        `Extremely low cell signal on Smart here in ${randomCityObj.name}. Internet outage? Emergency calls only...`,
        `Slow connection for home fiber at ${randomBrgyObj.name}. Can't load Microsoft Teams details...`,
        `Intermittent backbone router resets reported in ${randomCityObj.name} region. Checked telemetry boards.`,
        `Back to online connection inside ${randomBrgyObj.name}! Fast speeds confirm repairs working.`
      ];

      const idx = Math.floor(Math.random() * messages.length);
      const isPositive = messages[idx].includes("returned") || messages[idx].includes("online") || messages[idx].includes("fast");
      
      const newItem: SocialFeedItem = {
        id: `soc-sim-${Date.now()}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        username: authors[Math.floor(Math.random() * authors.length)],
        text: messages[idx],
        location: `${randomCityObj.name}, ${randomBrgyObj.name}`,
        timestamp: Date.now(),
        sentimentScore: isPositive ? 0.7 : -0.8,
        verifications: 0
      };

      // Add to state and save to storage with maximum bound of 20 to prevent leakages
      setSocialFeed(prev => {
        const keeps = [newItem, ...prev].slice(0, 18);
        localStorage.setItem("netpulse_social", JSON.stringify(keeps));
        return keeps;
      });
    };

    const interval = setInterval(handleNewsFeedSimulation, 45000); // Trigger every 45 secs
    return () => clearInterval(interval);
  }, []);

  // Handler: Verify a community report ("I'm affected too!")
  const handleVerifyReport = (reportId: string) => {
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        const newVerifications = r.verifications + 1;
        // Spec 4 trigger: 5+ verifications in 24h = auto-upgrade status to 🔴 Outage
        let newStatus = r.status;
        if (newVerifications >= 5 && r.status !== "Outage") {
          newStatus = "Outage";
        }
        return { ...r, verifications: newVerifications, status: newStatus };
      }
      return r;
    });

    saveReportsToStorage(updated);
    
    // Also update selected report reference to keep views fresh
    if (selectedReport && selectedReport.id === reportId) {
      const found = updated.find(x => x.id === reportId);
      if (found) setSelectedReport(found);
    }
  };

  // Handler: Verify a social post
  const handleVerifySocialPost = (feedId: string) => {
    const updated = socialFeed.map((item) => {
      if (item.id === feedId) {
        if (item.verifiedByCurrentUser) return item; // limit once
        return { 
          ...item, 
          verifications: item.verifications + 1,
          verifiedByCurrentUser: true 
        };
      }
      return item;
    });
    saveSocialToStorage(updated);
  };

  // Handler: GPS "Use My Location" Locator
  const handleLocatorGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const closest = findClosestBarangay(latitude, longitude);

        if (closest) {
          setSelectedCity(closest.city);
          setSelectedBarangay(closest.barangay);
          setGpsLoading(false);
        } else {
          setGpsError("Could not locate close Manila barangay from your metrics.");
          setGpsLoading(false);
        }
      },
      (err) => {
        // Enforce fallback if permission is blocked in test environment
        setGpsError("Permission Denied (Simulating location to Makati, Bel-Air).");
        setSelectedCity("Makati");
        setSelectedBarangay("Bel-Air");
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Handler: Reset default data
  const handleResetData = () => {
    localStorage.removeItem("netpulse_reports");
    localStorage.removeItem("netpulse_social");
    setReports(INITIAL_REPORTS);
    setSocialFeed(INITIAL_SOCIAL_FEED);
    setSelectedReport(null);
    alert("Database successfully restored to pristine initial mock templates!");
  };

  // Tab calculations
  // Get active local status based on selected location from dropdown
  const statusSummary = useMemo(() => {
    const matchLocation = `${selectedCity}, ${selectedBarangay}`;
    const relevantReports = reports.filter(r => r.location === matchLocation);

    // Is there any active maintenance?
    const isMaintenance = relevantReports.some(r => r.status === "Maintenance");
    // Count active outage reports
    const outageReports = relevantReports.filter(r => r.status === "Outage" || r.verifications >= 5);
    const degradedReports = relevantReports.filter(r => r.status === "Degraded");

    let pldtStatus: OutageStatus = "Normal";
    let smartStatus: OutageStatus = "Normal";
    let combinedStatus: OutageStatus = "Normal";

    // Deduce local status states from community logs
    relevantReports.forEach(r => {
      if (r.service === "PLDT Fiber") {
         if (r.status === "Outage" || r.verifications >= 5) pldtStatus = "Outage";
         else if (r.status === "Degraded" && pldtStatus !== "Outage") pldtStatus = "Degraded";
         else if (r.status === "Maintenance" && pldtStatus === "Normal") pldtStatus = "Maintenance";
      } else if (r.service === "SMART Mobile") {
         if (r.status === "Outage" || r.verifications >= 5) smartStatus = "Outage";
         else if (r.status === "Degraded" && smartStatus !== "Outage") smartStatus = "Degraded";
         else if (r.status === "Maintenance" && smartStatus === "Normal") smartStatus = "Maintenance";
      } else if (r.service === "Combined Backbone") {
         if (r.status === "Outage" || r.verifications >= 5) combinedStatus = "Outage";
         else if (r.status === "Degraded" && combinedStatus !== "Outage") combinedStatus = "Degraded";
         else if (r.status === "Maintenance" && combinedStatus === "Normal") combinedStatus = "Maintenance";
      }
    });

    return {
      totalLocalReports: relevantReports.length,
      pldtStatus,
      smartStatus,
      combinedStatus,
      outageCount: outageReports.length,
      degradedCount: degradedReports.length,
      isWidespread: relevantReports.length >= 3 || relevantReports.some(r => r.verifications >= 8)
    };
  }, [reports, selectedCity, selectedBarangay]);

  // City-Barangay Dropdown Options
  const currentCityObj = useMemo(() => {
    return METRO_MANILA_LOCATIONS.find(c => c.name === selectedCity);
  }, [selectedCity]);

  const reportCityObj = useMemo(() => {
    return METRO_MANILA_LOCATIONS.find(c => c.name === reportCity);
  }, [reportCity]);

  // Unified Sentiment Metrics across social logs
  const sentimentMeter = useMemo(() => {
    if (socialFeed.length === 0) return { pos: 33, neu: 33, neg: 34, vibe: "Neutral" };
    
    let sumScore = 0;
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;

    socialFeed.forEach((item) => {
      sumScore += item.sentimentScore;
      if (item.sentimentScore > 0.1) posCount++;
      else if (item.sentimentScore < -0.1) negCount++;
      else neuCount++;
    });

    const total = socialFeed.length;
    const pctPos = Math.round((posCount / total) * 100);
    const pctNeu = Math.round((neuCount / total) * 100);
    const pctNeg = 100 - (pctPos + pctNeu); // prevent round errors

    let vibe = "Neutral Tone";
    if (sumScore / total < -0.3) vibe = "🔴 Critical Frustration";
    else if (sumScore / total > 0.3) vibe = "🟢 Relaxed Connection Mode";
    else if (sumScore / total < 0) vibe = "🟡 Intermittent Irritation";

    return { pos: pctPos, neu: pctNeu, neg: pctNeg, vibe };
  }, [socialFeed]);

  // Filtering lists
  const filteredDashboardReports = useMemo(() => {
    return reports.filter(r => {
      if (!dashboardSearch) return true;
      const term = dashboardSearch.toLowerCase();
      return (
        r.service.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.notes.toLowerCase().includes(term)
      );
    });
  }, [reports, dashboardSearch]);

  const filteredSocialFeed = useMemo(() => {
    return socialFeed.filter(item => {
      if (!feedSearch) return true;
      const term = feedSearch.toLowerCase();
      return (
        item.text.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.username.toLowerCase().includes(term)
      );
    });
  }, [socialFeed, feedSearch]);

  // Handler: Create and Send Complaint (Mailto structure builder)
  const handleFormSubmitAndMailto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!privacyConsent) {
      alert("You must check the Data Privacy Act compliance box to proceed with reporting.");
      return;
    }

    const reportId = `rep-user-${Date.now()}`;
    const targetLocation = `${reportCity}, ${reportBarangay}`;

    // Get coordinates
    let parentCity = METRO_MANILA_LOCATIONS.find(c => c.name === reportCity);
    let coords: [number, number] = [14.5995, 120.9842]; // fall
    if (parentCity) {
      let bNode = parentCity.barangays.find(b => b.name === reportBarangay);
      if (bNode) coords = bNode.coordinates;
    }

    // Insert user report structure directly into active lists
    const userReport: CommunityReport = {
      id: reportId,
      service: reportService,
      location: targetLocation,
      city: reportCity,
      barangay: reportBarangay,
      status: "Outage", // Default to alert mode
      timestamp: Date.now(),
      verifications: 1, // First vote
      notes: reportNotes || "No detailed notes provided. Prompt inspection needed.",
      duration: reportDuration,
      reporter: reportReporter || "Anonymous User",
      coordinates: coords,
      sentiment: "Negative",
      diagnosticAttached: attachDiagnostics,
      diagnosticLog: attachDiagnostics ? diagnosticContent : undefined
    };

    const updated = [userReport, ...reports];
    saveReportsToStorage(updated);

    // BUILD EMAIL FOR DIRECT EXPORT VIA MAILTO
    const recipient = "help@pldt.com";
    const ccList = userPrefs.emailCCs.join(",");
    const timestampStr = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
    const subject = `OUTAGE REPORT: ${reportService} - ${targetLocation} - [${timestampStr}]`;
    
    let body = `Dear Customer Care Team / Regulatory Ombudsman,\n\n`;
    body += `This is an official ISP Outage incident report aggregated by NetPulse PH Metro Manila.\n\n`;
    body += `========================================================\n`;
    body += `ISP TARGET SERVICE : ${reportService}\n`;
    body += `REPORTING LOCATION: ${targetLocation}, Metro Manila\n`;
    body += `OBSERVED DURATION: ${reportDuration}\n`;
    body += `SUBMISSION TIME   : ${timestampStr}\n`;
    body += `REPORTER NAME     : ${reportReporter || "Anonymous Resident"}\n`;
    body += `STATUS LEVEL      : HIGH SERVICE DISRUPTION\n`;
    body += `========================================================\n\n`;
    body += `REPORTER COMPLAINT & FEEDBACK:\n`;
    body += `"${reportNotes || 'No notes added.'}"\n\n`;

    if (attachDiagnostics) {
      body += `DIAGNOSTIC TRACELOG ATTACHED:\n`;
      body += `--------------------------------------------------------\n`;
      body += `${diagnosticContent}\n`;
      body += `--------------------------------------------------------\n\n`;
    }

    body += `This complaint is compliant with the Philippine Data Privacy Act of 2012 (RA 10173). Explicit consent has been granted for anonymous analytical processing of location parameters for community reporting.\n\n`;
    body += `Please provide a tracking reference ticket for this service drop as soon as possible.\n\n`;
    body += `Sincerely,\n`;
    body += `${reportReporter || "Affected Resident"}\n`;
    body += `via NetPulse PH Netizen Collective`;

    // Fire Mailto Redirection
    const mailtoUrl = `mailto:${recipient}?cc=${encodeURIComponent(ccList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Clear Form inputs
    setReportNotes("");
    setReportReporter("");
    setAttachDiagnostics(false);
    setPrivacyConsent(false);
    setSubmitSuccess(true);
    
    // Redirect
    window.location.href = mailtoUrl;

    setTimeout(() => {
      setSubmitSuccess(false);
      // Auto redirect tab to let them see their report plotted live!
      setSelectedReport(userReport);
      setActiveTab("dashboard");
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080a0f] text-slate-100 font-sans selection:bg-rose-500/30 selection:text-white">
      {/* --- STICKY NAV HEADER --- */}
      <header className="sticky top-0 z-[1100] backdrop-blur-lg bg-[#080a0f]/90 border-b border-slate-800/80 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 via-rose-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-rose-400/25">
              <Activity className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NetPulse PH
                </span>
                <span className="text-[10px] bg-rose-500/15 text-rose-400 font-black px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">
                  Manila MVP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                ISP Outage Aggregator & Automated Consumer Escalator
              </p>
            </div>
          </div>

          {/* Mini Counter Bar */}
          <div className="flex items-center gap-2 border border-slate-800/80 bg-slate-900/60 pl-3 pr-4 py-1.5 rounded-full text-xs">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
            <span className="text-slate-400 font-medium">Active Outages:</span>
            <span className="text-rose-400 font-black">
              {reports.filter(r => r.status === "Outage" || r.verifications >= 5).length} Blocks
            </span>
          </div>

        </div>
      </header>

      {/* --- SECONDARY NAVIGATION RAIL --- */}
      <div className="border-b border-slate-800/40 bg-[#0a0d14] px-4 py-2 text-xs select-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
          {/* Main Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 gap-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedReport(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white shadow-sm border-t border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Compass className="w-4 h-4 text-rose-500" />
              <span>Map Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("social")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "social"
                  ? "bg-slate-800 text-white shadow-sm border-t border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>Netizen Chatter</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-slate-800 text-white shadow-sm border-t border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Send className="w-4 h-4 text-emerald-500 animate-bounce" />
              <span>Submit Outage Alert</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-slate-800 text-white shadow-sm border-t border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>Local Logs & Settings</span>
            </button>
          </nav>

          {/* Live UTC clock */}
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
            <Clock className="w-3.5 h-3.5" />
            <span>2026-05-27 18:25:57Z UTC</span>
          </div>
        </div>
      </div>

      {/* --- MAIN PAGE CONTENT WRAPPER --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* ========================================================
            TAB 1: LOCATION & STATUS DASHBOARD (with Map)
            ======================================================== */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sidebar check status widget (Columns: 4) */}
            <section className="lg:col-span-4 flex flex-col gap-5">
              
              {/* Dropdown selectors and GPS buttons */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                      Select Location Node
                    </h2>
                  </div>
                  <button
                    onClick={handleLocatorGps}
                    disabled={gpsLoading}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer select-none"
                  >
                    <Compass className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                    <span>{gpsLoading ? "Locating..." : "Use My GPS"}</span>
                  </button>
                </div>

                {gpsError && (
                  <div className="mb-3 p-2 text-[10px] bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    ℹ️ {gpsError}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      City / municipality
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        // Reset barangay default to first node of new search city
                        const match = METRO_MANILA_LOCATIONS.find(c => c.name === e.target.value);
                        if (match && match.barangays.length > 0) {
                          setSelectedBarangay(match.barangays[0].name);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none select-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all font-medium"
                    >
                      {METRO_MANILA_LOCATIONS.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Barangay
                    </label>
                    <select
                      value={selectedBarangay}
                      onChange={(e) => setSelectedBarangay(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none select-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all font-medium"
                    >
                      {currentCityObj?.barangays.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulated Latency disclaimer */}
                <p className="mt-3 text-[10px] text-slate-500 italic text-center select-none">
                  ⚡ Cross-referencing {reports.length} records instantly closer to targeted area.
                </p>
              </div>

              {/* REAL-TIME STATUS CARDS */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    LINK STABILITY IN {selectedBarangay.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    Calculated from anonymous crowdsourced logs
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* PLDT Fiber */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                        <Activity className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-bold leading-tight">PLDT Fiber Link</div>
                        <span className="text-[10px] text-slate-500">Fixed Line Broadband</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        statusSummary.pldtStatus === "Normal" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" :
                        statusSummary.pldtStatus === "Degraded" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                        statusSummary.pldtStatus === "Maintenance" ? "bg-blue-500/15 text-blue-400 border-blue-500/25" :
                        "bg-rose-500/15 text-rose-400 border-rose-500/25"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          statusSummary.pldtStatus === "Normal" ? "bg-emerald-400" :
                          statusSummary.pldtStatus === "Degraded" ? "bg-amber-400" :
                          statusSummary.pldtStatus === "Maintenance" ? "bg-blue-400" :
                          "bg-rose-400 animate-ping"
                        }`}></span>
                        {statusSummary.pldtStatus}
                      </span>
                    </div>
                  </div>

                  {/* SMART Mobile */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Activity className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-bold leading-tight">SMART Mobile</div>
                        <span className="text-[10px] text-slate-500">Smart Cellular / LTE / 5G</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        statusSummary.smartStatus === "Normal" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" :
                        statusSummary.smartStatus === "Degraded" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                        statusSummary.smartStatus === "Maintenance" ? "bg-blue-500/15 text-blue-400 border-blue-500/25" :
                        "bg-rose-500/15 text-rose-400 border-rose-500/25"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          statusSummary.smartStatus === "Normal" ? "bg-emerald-400" :
                          statusSummary.smartStatus === "Degraded" ? "bg-amber-400" :
                          statusSummary.smartStatus === "Maintenance" ? "bg-blue-400" :
                          "bg-rose-400 animate-ping"
                        }`}></span>
                        {statusSummary.smartStatus}
                      </span>
                    </div>
                  </div>

                  {/* Combined Backbone */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Server className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-bold leading-tight">Combined Backbone</div>
                        <span className="text-[10px] text-slate-500">Macro Transport Link</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        statusSummary.combinedStatus === "Normal" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" :
                        statusSummary.combinedStatus === "Degraded" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                        statusSummary.combinedStatus === "Maintenance" ? "bg-blue-500/15 text-blue-400 border-blue-500/25" :
                        "bg-rose-500/15 text-rose-400 border-rose-500/25"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          statusSummary.combinedStatus === "Normal" ? "bg-emerald-400" :
                          statusSummary.combinedStatus === "Degraded" ? "bg-amber-400" :
                          statusSummary.combinedStatus === "Maintenance" ? "bg-blue-400" :
                          "bg-rose-400 animate-ping"
                        }`}></span>
                        {statusSummary.combinedStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IS THIS JUST ME? DECISION LOGIC */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-rose-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    "Is This Just Me?" Analyzer
                  </h3>
                </div>

                <div className="text-xs leading-relaxed text-slate-300">
                  <p className="mb-2">
                    Active block reports in <strong className="text-white">{selectedBarangay}</strong> within last 24h:
                  </p>
                  
                  {statusSummary.totalLocalReports === 0 ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                      <span className="text-emerald-400 font-bold block mb-1">
                        ✅ Localized Issue Suspected
                      </span>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        No outage reports have been registered for this block yet. If your router has a red light, try:
                      </p>
                      <ul className="text-[11px] text-slate-500 list-disc list-inside mt-1 flex flex-col gap-0.5">
                        <li>Restarting ONT Fiber Modem (unplug 30s)</li>
                        <li>Checking for loose optical fiber patch cords</li>
                        <li>Submitting an outage log to spark alerts!</li>
                      </ul>
                    </div>
                  ) : statusSummary.isWidespread ? (
                    <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                      <span className="text-rose-400 font-bold block mb-1">
                        🚨 Warning: Verified Local Outage
                      </span>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        We detected <strong className="text-rose-300">{statusSummary.totalLocalReports} active reports</strong> here. This indicates a widespread trunk disruption. 
                      </p>
                      <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Suggested step: Use "Submit Outage Alert" to draft complaint email to regulators.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                      <span className="text-amber-400 font-bold block mb-1">
                        ⚠️ Minor Link Degradation
                      </span>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Logged <strong className="text-amber-300">{statusSummary.totalLocalReports} isolated report(s)</strong>. The ISP may be servicing regional nodes or routing around backhaul capacity.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </section>

            {/* Main map display panel (Columns: 8) */}
            <section className="lg:col-span-8 flex flex-col gap-5">
              
              {/* Map Layout Component */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 select-none">
                  <div>
                    <h2 className="text-md font-extrabold text-white tracking-tight flex items-center gap-1.5">
                      📍 Metro Manila Live Outage Overlay
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time interactive plot of active PLDT/SMART infrastructure blocks
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 border border-slate-800 bg-slate-900 rounded-lg px-2.5 py-1.5 leading-snug">
                    Tip: Click circular node hotspots on map to show detailed logs
                  </div>
                </div>

                {/* Leaflet map wrapper */}
                <LeafletMap 
                  reports={reports} 
                  selectedReport={selectedReport}
                  onSelectReport={(rep) => setSelectedReport(rep)}
                />
              </div>

              {/* LIST OF LOGGED INCIDENT REPORTS FOR THIS REGION */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 select-none">
                  <div>
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                      Local Incident Dispatch Feed
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Verify community reports to upgrade warning states to regulatory level
                    </p>
                  </div>

                  {/* Search Incident Inputs */}
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter reports by city..."
                      value={dashboardSearch}
                      onChange={(e) => setDashboardSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg text-[11px] leading-none text-white pl-8 pr-3 py-2 outline-none focus:border-rose-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Cards rendering */}
                <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredDashboardReports.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      No incident logs matches your filter term.
                    </div>
                  ) : (
                    filteredDashboardReports.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                          selectedReport?.id === item.id 
                            ? "bg-slate-900 border-rose-500/60 ring-1 ring-rose-500/10 shadow-lg" 
                            : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                        onClick={() => setSelectedReport(item)}
                      >
                        <div className="flex-1 flex gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                            item.status === "Outage" ? "bg-rose-500 animate-pulse" :
                            item.status === "Degraded" ? "bg-amber-500" :
                            item.status === "Maintenance" ? "bg-blue-500" :
                            "bg-emerald-500"
                          }`}></div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">{item.service}</span>
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded">
                                📍 {item.location}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 italic line-clamp-2">
                              "{item.notes}"
                            </p>
                            
                            {item.diagnosticAttached && (
                              <div className="mt-2 text-[10px] text-indigo-400 font-medium flex items-center gap-1 bg-indigo-500/5 px-2 py-0.5 rounded width-max">
                                <FileCode className="w-3 h-3" />
                                Custom trace diagnostics attached
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verification controls */}
                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                          <div className="text-right">
                            <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              Confirmations
                            </span>
                            <span className="font-extrabold text-white block text-sm">
                              {item.verifications}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyReport(item.id);
                            }}
                            className="bg-slate-800 hover:bg-rose-500/25 border border-slate-700/80 hover:border-rose-500/40 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 inline-flex hover:scale-103"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Verify (+1)</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </section>

          </div>
        )}

        {/* ========================================================
            TAB 2: SOCIAL MOOD & SENTIMENT FEED
            ======================================================== */}
        {activeTab === "social" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sentiment Meter Side Panel (Columns: 4) */}
            <section className="lg:col-span-4 flex flex-col gap-5">
              
              {/* Static sentiment dial */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div className="border-b border-slate-800 pb-3 select-none">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    METRO MANILA SOCIAL SENTIMENT KPI
                  </span>
                  <p className="text-xs text-slate-500">
                    Real-time parsing weight score of netizen chatter
                  </p>
                </div>

                <div className="text-center py-4 bg-slate-900/60 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Current Aggregate Vibe
                  </span>
                  <span className="text-md sm:text-lg font-black text-white mt-1 block">
                    {sentimentMeter.vibe}
                  </span>
                </div>

                {/* Custom multi-color progress bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>Mood Division %</span>
                    <span>Total {socialFeed.length} Analysed</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div 
                      style={{ width: `${sentimentMeter.pos}%` }} 
                      className="bg-emerald-500 h-full transition-all" 
                      title={`Positive: ${sentimentMeter.pos}%`}
                    />
                    <div 
                      style={{ width: `${sentimentMeter.neu}%` }} 
                      className="bg-slate-400 h-full transition-all"
                      title={`Neutral: ${sentimentMeter.neu}%`}
                    />
                    <div 
                      style={{ width: `${sentimentMeter.neg}%` }} 
                      className="bg-rose-500 h-full transition-all"
                      title={`Negative: ${sentimentMeter.neg}%`}
                    />
                  </div>
                  
                  {/* Legend tags */}
                  <div className="flex justify-between items-center mt-3 text-[10px] select-none font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Positive ({sentimentMeter.pos}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Neutral ({sentimentMeter.neu}%)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Negative ({sentimentMeter.neg}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs leading-relaxed text-indigo-300">
                  <span className="font-bold flex items-center gap-1 text-indigo-400 mb-1">
                    <Info className="w-4.5 h-4.5" />
                    Auto-Deduplication Logic Active
                  </span>
                  <p className="text-[11px] leading-normal text-slate-400">
                    Social reports containing duplicate keyword clusters within a 10-minute slot are grouped to filter noise and protect map resolution.
                  </p>
                </div>
              </div>

              {/* Keyword Cloud representation */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3 border-b border-indigo-500/10 pb-2">
                  MONITORED KEYWORDS PH
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-mono">"PLDT down"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-mono">"walang signal"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-mono">"bagal wifi"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-mono">"Smart LTE fail"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg font-mono">"DICT reporting"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg font-mono">"fiber cut"</span>
                  <span className="text-[11px] px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-mono">"maintenance notice"</span>
                </div>
              </div>

            </section>

            {/* Chatters list viewport (Columns: 8) */}
            <section className="lg:col-span-8 bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-1.5 select-none">
                    💬 Tracked Netizen Feed
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live sentiment parsing on Twitter/Reddit complaints across Metro Manila
                  </p>
                </div>

                {/* Filter and search */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs leading-none text-white pl-8 pr-3 py-2.5 outline-none focus:border-amber-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Scrolling feed list */}
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredSocialFeed.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs text-center select-none">
                     No matches found for that keyword filter.
                  </div>
                ) : (
                  filteredSocialFeed.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all text-xs flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border tracking-wider select-none uppercase ${
                            item.platform === "twitter" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                            item.platform === "reddit" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {item.platform[0]}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-[11px]">@{item.username}</div>
                            <span className="text-[9px] text-slate-500">
                              {item.platform.toUpperCase()} &bull; {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Location and indicator */}
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-medium">
                            📍 {item.location}
                          </span>
                        </div>
                      </div>

                      {/* Content block */}
                      <p className="text-slate-300 leading-normal text-xs sm:text-[13px] tracking-normal font-sans bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/45 italic">
                        "{item.text}"
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 text-[10px]">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          item.sentimentScore > 0.1 ? "text-emerald-400" :
                          item.sentimentScore < -0.1 ? "text-rose-400" :
                          "text-slate-400"
                        }`}>
                          Parse Vibe: {
                            item.sentimentScore > 0.1 ? "😊 Positive" :
                            item.sentimentScore < -0.1 ? "😤 Frustrated" :
                            "😐 Neutral"
                          }
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold">
                            {item.verifications} reports verified
                          </span>
                          
                          <button
                            onClick={() => handleVerifySocialPost(item.id)}
                            disabled={item.verifiedByCurrentUser}
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-all text-[10px] flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                              item.verifiedByCurrentUser
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 cursor-default"
                                : "bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{item.verifiedByCurrentUser ? "Verified" : "+1 affected"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

        {/* ========================================================
            TAB 3: COMPLAINT EMAIL GENERATOR & ALERT SUBMIT
            ======================================================== */}
        {activeTab === "report" && (
          <div className="max-w-3xl mx-auto bg-[#0e121b] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="border-b border-slate-850 pb-4 mb-6">
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                📡 Broadcast Community Incident Report
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Submitting plots your incident to the live coordinate maps and compiles a formal complaint email using regulated mail templates.
              </p>
            </div>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                <div>
                  <strong className="block text-white">Outage Alert Successfully Aggregated!</strong>
                  Your default local mail app is launching with pre-filled details. Check your map log section briefly.
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmitAndMailto} className="flex flex-col gap-5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Outage Service */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Affected ISP Service
                  </label>
                  <select
                    value={reportService}
                    onChange={(e) => setReportService(e.target.value as ServiceType)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2.5 outline-none select-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-semibold"
                  >
                    <option value="PLDT Fiber">PLDT Fiber Broadband</option>
                    <option value="SMART Mobile">SMART Mobile Cellular (LTE/5G)</option>
                    <option value="Combined Backbone">Combined Fiber & Cellular Outage</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Downtime Duration
                  </label>
                  <select
                    value={reportDuration}
                    onChange={(e) => setReportDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2.5 outline-none select-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-semibold"
                  >
                    <option value="Less than 1 hour">Less than 1 hour</option>
                    <option value="1-2 hours">1-2 hours</option>
                    <option value="2-4 hours">2-4 hours</option>
                    <option value="4-12 hours">4-12 hours</option>
                    <option value="Over 24 hours">Over 24 hours (Chronic Outage)</option>
                    <option value="Intermittent (Drops constantly)">Intermittent Drops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Location: City
                  </label>
                  <select
                    value={reportCity}
                    onChange={(e) => {
                      setReportCity(e.target.value);
                      const matchIdx = METRO_MANILA_LOCATIONS.find(c => c.name === e.target.value);
                      if (matchIdx && matchIdx.barangays.length > 0) {
                        setReportBarangay(matchIdx.barangays[0].name);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2.5 outline-none select-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-semibold"
                  >
                    {METRO_MANILA_LOCATIONS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barangay */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Location: Barangay
                  </label>
                  <select
                    value={reportBarangay}
                    onChange={(e) => setReportBarangay(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2.5 outline-none select-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-semibold"
                  >
                    {reportCityObj?.barangays.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Optional handle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Your Name / Pseudonym (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 select-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. resident_firme_99"
                      value={reportReporter}
                      onChange={(e) => setReportReporter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-normal">
                    This moniker will look logged map-side. Safe to leave empty for complete anonymity.
                  </span>
                </div>

                {/* CC escalation */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Regulatory CC Routing (Escalation)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 select-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value="help@pldt.com, complaints@dict.gov.ph"
                      className="w-full bg-slate-900/60 text-slate-500 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 font-mono select-none"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-normal">
                    Aggregates direct copies to Smart / PLDT Customer Ombudsman and the Department of Information and Communications Technology (DICT).
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detailed Complaint / Observed Symptoms
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your wifi link indicator light, speed drop metrics, diagnostic warnings, or impact to work-from-home classes..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-150 rounded-lg p-3 outline-none focus:border-emerald-500/50 transition-all font-sans text-xs"
                />
              </div>

              {/* Diagnostic Log Attachment option */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <FileCode className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Run Local Network Diagnostic Logs</span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Simulate background telemetry (ping traces, signal strength RSSI values, path latency hops) to append as an engineering trace file.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={attachDiagnostics}
                      onChange={(e) => setAttachDiagnostics(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white border border-slate-705"></div>
                  </label>
                </div>

                {attachDiagnostics && (
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                    <span className="text-[9px] font-bold text-indigo-400 font-mono block mb-1">
                      DEBUG_CLI_OUTPUT:
                    </span>
                    <pre className="text-[9px] text-slate-400 font-mono tracking-tight leading-relaxed overflow-x-auto whitespace-pre">
                      {diagnosticContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* PH Data Privacy Compliance Toggle */}
              <div className="bg-slate-900/40 p-4 border border-rose-500/10 hover:border-rose-500/25 rounded-xl transition-all">
                <div className="flex gap-3">
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      required
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 text-rose-600 bg-slate-900 outline-none focus:ring-0 active:scale-95 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="privacyConsent" className="leading-snug text-[10px] md:text-xs text-slate-400 tracking-normal select-none cursor-pointer">
                    <strong className="text-white block mb-0.5">Philippine Data Privacy Act (RA 10173) Consent</strong>
                    I explicitly consent to let NetPulse PH process my location (City/Barangay) and service diagnostics. NetPulse PH guarantees zero PII collection, fully anonymizes coordinate listings, and strictly avoids cookie tracking post-MVP.
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 tracking-wide cursor-pointer select-none w-full sm:w-auto"
                >
                  <Send className="w-4.5 h-4.5" />
                  <span>Generate Ticket & Send Complaint</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================
            TAB 4: LOCAL DATA LOGS & COMPLIANCE HISTORY
            ======================================================== */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Regulatory Notice block (Columns: 5) */}
            <section className="lg:col-span-5 flex flex-col gap-5 select-none">
              
              {/* PH Compliance information card */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                    PH Regulatory & Privacy Scope
                  </h2>
                </div>

                <div className="text-xs text-slate-300 flex flex-col gap-3 leading-relaxed">
                  <p>
                    NetPulse PH is an open community-guided initiative following guidelines defined by the National Privacy Commission (NPC) of the Philippines.
                  </p>
                  <div>
                    <strong className="text-white block mb-1">RA 10173 Compliance Checklist:</strong>
                    <ul className="list-disc list-inside text-slate-400 text-[11px] flex flex-col gap-1">
                      <li>Anonymized reports: No Names or Account details parsed</li>
                      <li>Geospatial coordinates limited to Barangay centroids</li>
                      <li>Encrypted browser local storage persistence limits leakage</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Key Escalation Contact Channels:</strong>
                    <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono leading-relaxed text-slate-400 flex flex-col gap-1">
                      <div>🏢 DICT Complaints: <span className="text-indigo-400">complaints@dict.gov.ph</span></div>
                      <div>📞 NTC Hotline: <span className="text-indigo-400">consumer@ntc.gov.ph / 1682</span></div>
                      <div>📡 PLDT Customer Care: <span className="text-indigo-400">help@pldt.com</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset block database state trigger */}
              <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase block">
                  Danger Management
                </span>
                <p className="text-xs text-slate-500 leading-normal">
                  Wipe all submitted cache entries and restore default Metro Manila outage data points:
                </p>
                <button
                  onClick={handleResetData}
                  className="bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 font-bold px-4 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Restore App Default State</span>
                </button>
              </div>

            </section>

            {/* List user local telemetry reports (Columns: 7) */}
            <section className="lg:col-span-7 bg-[#0e121b] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase select-none">
                  📋 User Submitted Log History
                </h2>
                <p className="text-xs text-slate-500">
                  Incidents registered specifically in this browser's session storage buffer
                </p>
              </div>

              {/* Filter user reports list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-1 text-xs">
                {reports.filter(r => r.id.startsWith("rep-user-")).length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl text-slate-500 leading-normal flex flex-col items-center justify-center gap-2 select-none">
                     <FileText className="w-8 h-8 opacity-25" />
                     <span>No user-created outages recorded in this browser storage yet.<br />Submit an alert overlay to view logs here!</span>
                  </div>
                ) : (
                  reports.filter(r => r.id.startsWith("rep-user-")).map((rep) => (
                    <div 
                      key={rep.id}
                      className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-extrabold text-white text-xs">{rep.service}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            📍 {rep.location} &bull; {new Date(rep.timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                          </span>
                        </div>
                        <span className="px-2 py-0.5 font-bold uppercase text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                          {rep.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 italic leading-relaxed bg-[#0a0d14] p-2.5 rounded border border-slate-850">
                        "${rep.notes}"
                      </p>

                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">
                          Duration Check: <strong className="text-slate-300">{rep.duration}</strong>
                        </span>

                        {rep.diagnosticAttached && (
                          <span className="text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 inline-flex items-center gap-1 font-mono text-[9px]">
                            ⚡ Trace attached
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

      </main>

      {/* --- FOOTER INFO SECTION --- */}
      <footer className="border-t border-slate-800/60 bg-[#06080c] py-6 px-4 mt-12 text-slate-500 text-xs text-center select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[10px] md:text-xs">
            NetPulse PH Core. Prepared in complete alignment with <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>.
          </p>
          <p className="text-[10px] font-mono text-slate-600">
            Rendered: 2026-05-27 18:25:57Z UTC
          </p>
        </div>
      </footer>

      {/* 
        ========================================================
        DEPLOYMENT & TESTING CHECKLIST (requested format)
        - Host on GitHub Pages / Netlify Drop / Vercel
        - Test on mobile Chrome/Safari (Viewport: 320px–1440px compliant)
        - Verify mailto: opens default client with pre-filled fields
        - Check localStorage persistence across refreshes & deep loops
        - Replace mock data with real endpoints later (Reddit API, X API, PLDT status scraper)
        - Add analytics (Plausible/Matomo) post-MVP
        ========================================================
      */}
    </div>
  );
}
