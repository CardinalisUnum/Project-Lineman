import { CommunityReport, SocialFeedItem, CityInfo } from "./types";

// Metro Manila Cities and Barangays with coordinates
export const METRO_MANILA_LOCATIONS: CityInfo[] = [
  {
    name: "Makati",
    barangays: [
      { name: "Bel-Air", coordinates: [14.5612, 121.0289] },
      { name: "San Lorenzo", coordinates: [14.5471, 121.0211] },
      { name: "Poblacion", coordinates: [14.5694, 121.0333] },
      { name: "Guadalupe Nuevo", coordinates: [14.5621, 121.0450] }
    ]
  },
  {
    name: "Quezon City",
    barangays: [
      { name: "Diliman", coordinates: [14.6517, 121.0494] },
      { name: "Commonwealth", coordinates: [14.6934, 121.0805] },
      { name: "Kamuning", coordinates: [14.6294, 121.0378] },
      { name: "Batasan Hills", coordinates: [14.6864, 121.0950] }
    ]
  },
  {
    name: "Taguig",
    barangays: [
      { name: "Fort Bonifacio (BGC)", coordinates: [14.5514, 121.0474] },
      { name: "Western Bicutan", coordinates: [14.5167, 121.0333] },
      { name: "Ususan", coordinates: [14.5361, 121.0601] }
    ]
  },
  {
    name: "Pasig",
    barangays: [
      { name: "Kapitolyo", coordinates: [14.5714, 121.0612] },
      { name: "San Antonio", coordinates: [14.5828, 121.0658] },
      { name: "Ugong", coordinates: [14.5878, 121.0801] }
    ]
  },
  {
    name: "Mandaluyong",
    barangays: [
      { name: "Wack-Wack", coordinates: [14.5901, 121.0544] },
      { name: "Highway Hills", coordinates: [14.5794, 121.0505] },
      { name: "Plainview", coordinates: [14.5731, 121.0381] }
    ]
  },
  {
    name: "Manila",
    barangays: [
      { name: "Sampaloc", coordinates: [14.6125, 120.9958] },
      { name: "Malate", coordinates: [14.5694, 120.9886] },
      { name: "Ermita", coordinates: [14.5791, 120.9794] },
      { name: "Binondo", coordinates: [14.6022, 120.9747] }
    ]
  }
];

// Helper to calculate distance in KM between coordinates (for GPS routing/fallback)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Locate closest barangay based on GPS coords
export function findClosestBarangay(lat: number, lng: number): { city: string; barangay: string; distance: number } | null {
  let closest: { city: string; barangay: string; distance: number } | null = null;
  let minDistance = Infinity;

  for (const city of METRO_MANILA_LOCATIONS) {
    for (const brgy of city.barangays) {
      const dist = getDistanceKm(lat, lng, brgy.coordinates[0], brgy.coordinates[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closest = { city: city.name, barangay: brgy.name, distance: dist };
      }
    }
  }
  return closest;
}

// Static initial community reports representing typical outage patterns
export const INITIAL_REPORTS: CommunityReport[] = [
  {
    id: "rep-1",
    service: "PLDT Fiber",
    location: "Quezon City, Diliman",
    city: "Quezon City",
    barangay: "Diliman",
    status: "Outage",
    timestamp: Date.now() - 3 * 3600 * 1000, // 3 hours ago
    verifications: 14,
    notes: "Total loss of fiber connection. GPON link power indicator is flashing red. Called customer support, they confirmed a fiber cut near Katipunan Avenue.",
    duration: "Over 3 hours",
    reporter: "DilimanTech_99",
    coordinates: [14.6517, 121.0494],
    sentiment: "Negative",
    diagnosticAttached: true,
    diagnosticLog: "PING google.com (8.8.8.8) 56(84) bytes of data.\nFrom 192.168.1.1 icmp_seq=1 Destination Host Unreachable\nFrom 192.168.1.1 icmp_seq=2 Destination Host Unreachable\n--- google.com ping statistics ---\n10 packets transmitted, 0 received, 100% packet loss, time 9014ms"
  },
  {
    id: "rep-2",
    service: "SMART Mobile",
    location: "Taguig, Fort Bonifacio (BGC)",
    city: "Taguig",
    barangay: "Fort Bonifacio (BGC)",
    status: "Degraded",
    timestamp: Date.now() - 2 * 3600 * 1000, // 2 hours ago
    verifications: 8,
    notes: "Extremely high packet loss and slow download speeds (0.2 Mbps down). Upload fails constantly. VoLTE dropping audio.",
    duration: "2 hours",
    reporter: "bgcboss_dev",
    coordinates: [14.5514, 121.0474],
    sentiment: "Negative",
    diagnosticAttached: false
  },
  {
    id: "rep-3",
    service: "Combined Backbone",
    location: "Makati, Bel-Air",
    city: "Makati",
    barangay: "Bel-Air",
    status: "Outage",
    timestamp: Date.now() - 1.5 * 3600 * 1000,
    verifications: 22,
    notes: "Both PLDT Fiber and Smart cellular data are completely dead in our block. Appears to be a major localized routing or power outage at the sub-exchange site.",
    duration: "1.5 hours",
    reporter: "MakatiMD_Exec",
    coordinates: [14.5612, 121.0289],
    sentiment: "Negative",
    diagnosticAttached: true,
    diagnosticLog: "TRACEROUTE to dns.google (8.8.8.8), 30 hops max, 60 byte packets\n 1  192.168.1.1 (192.168.1.1)  0.923 ms  0.741 ms  0.882 ms\n 2  10.120.0.1 (10.120.0.1)  * * *\n 3  * * *\n 4  * * *\n--- Trace completely dropped at PLDT Edge router ---\nError: Host unreachable"
  },
  {
    id: "rep-4",
    service: "PLDT Fiber",
    location: "Pasig, Kapitolyo",
    city: "Pasig",
    barangay: "Kapitolyo",
    status: "Maintenance",
    timestamp: Date.now() - 4 * 3600 * 1000,
    verifications: 3,
    notes: "Scheduled maintenance announced yesterday: Network upgrading. High latency expected from 1 PM to 5 PM today.",
    duration: "4 hours",
    reporter: "ResidentEngr",
    coordinates: [14.5714, 121.0612],
    sentiment: "Neutral",
    diagnosticAttached: false
  },
  {
    id: "rep-5",
    service: "SMART Mobile",
    location: "Manila, Sampaloc",
    city: "Manila",
    barangay: "Sampaloc",
    status: "Outage",
    timestamp: Date.now() - 45 * 60 * 1000, // 45 mins ago
    verifications: 11,
    notes: "No signal/emergency calls only on dual-sim SMART. Red light on relative smart cell-tower near Lacson. Work from home is compromised.",
    duration: "45 minutes",
    reporter: "SampaStud_20",
    coordinates: [14.6125, 120.9958],
    sentiment: "Negative",
    diagnosticAttached: true,
    diagnosticLog: "Smart LTE tower scan:\nCell ID: 0x4B3A2 (Inactive)\nSignal Strength: -115 dBm (Critical Drop)\nStatus: Network Access Rejected by Operator Hub"
  },
  {
    id: "rep-6",
    service: "PLDT Fiber",
    location: "Mandaluyong, Plainview",
    city: "Mandaluyong",
    barangay: "Plainview",
    status: "Normal",
    timestamp: Date.now() - 6 * 3600 * 1000,
    verifications: 1,
    notes: "Spike of packet loss earlier, but connection is fully restored and normal now. Running deep speedtests.",
    duration: "Resolved",
    reporter: "SanderManda",
    coordinates: [14.5731, 121.0381],
    sentiment: "Positive",
    diagnosticAttached: false
  },
  {
    id: "rep-7",
    service: "PLDT Fiber",
    location: "Taguig, Western Bicutan",
    city: "Taguig",
    barangay: "Western Bicutan",
    status: "Degraded",
    timestamp: Date.now() - 5 * 3600 * 1000,
    verifications: 6,
    notes: "Slow download speed of around 1.5 Mbps compared to subscribed speed 200 Mbps. Web surfing works but streaming buffers continuously.",
    duration: "5 hours",
    reporter: "WFH_Mom_PH",
    coordinates: [14.5167, 121.0333],
    sentiment: "Negative",
    diagnosticAttached: false
  }
];

// Seed raw social posts with philippine slangs and sentiments
export const INITIAL_SOCIAL_FEED: SocialFeedItem[] = [
  {
    id: "soc-1",
    platform: "twitter",
    username: "pldt_shifter_92",
    text: "PLDT down na naman sa Diliman, QC area! Sino pa walang internet? Work-from-home is painful right now. #PLDThomeFibr #PLDTdown",
    location: "Quezon City, Diliman",
    timestamp: Date.now() - 15 * 60 * 1000, // 15 mins ago
    sentimentScore: -0.8,
    verifications: 7
  },
  {
    id: "soc-2",
    platform: "reddit",
    username: "u/MakatiFreelancer",
    text: "Smart LTE is completely dead close to Salcedo Village/Bel-Air area Makati. Anyone else experiencing zero data, or is it just my iPhone acting up again?",
    location: "Makati, Bel-Air",
    timestamp: Date.now() - 22 * 60 * 1000,
    sentimentScore: -0.6,
    verifications: 4
  },
  {
    id: "soc-3",
    platform: "facebook",
    username: "Ina ng Tahanan - Sampaloc Hub",
    text: "Mag-ingat po ang lahat na nag-aaral ngayon sa Sampaloc Manila. Wala pong signal ang Smart/Sun mobile data simula pa kanina. Hirap kumonekta sa Zoom.",
    location: "Manila, Sampaloc",
    timestamp: Date.now() - 35 * 60 * 1000,
    sentimentScore: -0.7,
    verifications: 10
  },
  {
    id: "soc-4",
    platform: "twitter",
    username: "bgc_coffee_coder",
    text: "Praise be! PLDT internet connection has returned inside High Street BGC Taguig. Speeds are stable around 150Mbps again. Back to writing React components.",
    location: "Taguig, Fort Bonifacio (BGC)",
    timestamp: Date.now() - 55 * 60 * 1000,
    sentimentScore: 0.9,
    verifications: 2
  },
  {
    id: "soc-5",
    platform: "reddit",
    username: "u/MandaluyongDev",
    text: "PSA: PLDT announced physical line maintenance starting 1 PM today for Plainview / Wack-Wack Mandaluyong. Expected intermittent downtime.",
    location: "Mandaluyong, Plainview",
    timestamp: Date.now() - 2 * 3600 * 1000,
    sentimentScore: 0.0,
    verifications: 1
  },
  {
    id: "soc-6",
    platform: "twitter",
    username: "angryPHnetizen",
    text: "Subscribed to PLDT Plan 1499 for 200Mbps but running at literal 0.5Mbps. Anuna po? Sabi ng CS may degraded node sa Pasig area. 😡",
    location: "Pasig, San Antonio",
    timestamp: Date.now() - 2.5 * 3600 * 1000,
    sentimentScore: -0.9,
    verifications: 12
  },
  {
    id: "soc-7",
    platform: "facebook",
    username: "Guadalupe Barangay Alerts",
    text: "PAUNAWA: May mga ulat po ng naputol na kable ng kuryente at internet sa Guadalupe Nuevo. Inaayos na po ng PLDT at Meralco ang linya.",
    location: "Makati, Guadalupe Nuevo",
    timestamp: Date.now() - 3.5 * 3600 * 1000,
    sentimentScore: -0.4,
    verifications: 15
  },
  {
    id: "soc-8",
    platform: "twitter",
    username: "juan_d_manda",
    text: "Stable naman ang Mobile LTE Smart at PLDT WiFi rito sa Wack-Wack Mandaluyong ngayon. Hopefully walang bagyo o ulan para hindi bumaba.",
    location: "Mandaluyong, Wack-Wack",
    timestamp: Date.now() - 6 * 3600 * 1000,
    sentimentScore: 0.6,
    verifications: 0
  }
];

// Diagnostic templates
export function generateMockDiagnostics(service: string, location: string): string {
  const isPldt = service.toLowerCase().includes("pldt") || service.toLowerCase().includes("backbone");
  const carrier = isPldt ? "PLDT-FIBR-MANILA-GATEWAY" : "SMART-MOBILE-HSPA-MNC515";
  const userIP = isPldt ? "112.204.45.182" : "10.231.114.7";
  const dnsServer = isPldt ? "124.106.4.2 (PLDT DNS)" : "121.1.3.14 (Smart DNS)";
  const gatewayIP = isPldt ? "112.204.45.1" : "10.231.114.1";

  const dateStr = new Date().toISOString();

  return `=========================================
NETPULSE PH - AUTOMATED DIAGNOSTIC LOG
=========================================
TIMESTAMP: ${dateStr}
ISP/SERVICE: ${service}
USER SELECTED LOCATION: ${location}
MOCK INTERFACING IP: ${userIP}
DEFAULT GATEWAY: ${gatewayIP}
PRIMARY DNS ENFORCED: ${dnsServer}
-----------------------------------------
[TEST 1: LOCAL NETWORK INTERFACE]
- Wi-Fi/LTE Baseband Connection: SUCCESSFUL
- Local IP Allocation: ${userIP} (DHCP/DHCPv6)

[TEST 2: GATEWAY PING ANALYSIS]
- Ping to Gateway IP (${gatewayIP}):
  Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
  Result: REQUEST TIMED OUT. Local optical node or tower downlink disconnected.

[TEST 3: PUBLIC DNS RESOLUTION]
- Resolving DNS Host google.com via ${dnsServer}:
  Result: FAILED - Server unreachable (timeout 5000ms).

[TEST 4: NETWORK PATH ROUTING (TRACEROUTE)]
  1  192.168.1.1 (CPE-Router)  0.72 ms   0.65 ms   0.61 ms
  2  ${gatewayIP}  *  *  * (No response - timeout)
  3  *  *  * (No response - timeout)
  4  *  *  * (No response - timeout)
  Result: Hop 2 blocked, local circuit/hub power loss suspect.

[TEST 5: CELLULAR METRICS (FOR SMART)]
  - Tower CellId: PL-MNC515-LAC14902-CI11029
  - Received Signal Strength Indicator (RSSI): -113 dBm (CRITICAL DOWNTURN)
  - Reference Signal Received Power (RSRP): -121 dBm (ZERO CAPABILIY)

-----------------------------------------
STATUS SUMMARY: BACKBONE OUTAGE IDENTIFIED
=========================================`;
}
