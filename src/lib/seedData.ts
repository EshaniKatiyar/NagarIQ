import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const SEED_ISSUES = [
  { title: 'Large pothole causing accidents', category: 'pothole', severity: 'critical', neighbourhood: 'Koramangala', location: { lat: 12.9352, lng: 77.6245 }, upvotes: 47, status: 'escalated', department: 'BBMP Roads', estimatedCost: 25000, description: 'A massive pothole on the main junction is causing vehicles to swerve dangerously. Three accidents reported this week.', tags: ['road', 'pothole', 'dangerous', 'accident'] },
  { title: 'Streetlight outage near park', category: 'streetlight', severity: 'high', neighbourhood: 'Indiranagar', location: { lat: 12.9784, lng: 77.6408 }, upvotes: 23, status: 'verified', department: 'BESCOM', estimatedCost: 8000, description: 'Five consecutive streetlights near the children\'s park have been non-functional for 2 weeks. Area is completely dark at night.', tags: ['streetlight', 'dark', 'safety', 'park'] },
  { title: 'Water main leaking for 3 days', category: 'waterleakage', severity: 'critical', neighbourhood: 'HSR Layout', location: { lat: 12.9116, lng: 77.6389 }, upvotes: 61, status: 'escalated', department: 'BWSSB', estimatedCost: 40000, description: 'A burst water main on the main road has been leaking for 3 days. Road is flooded and water is being wasted.', tags: ['water', 'leak', 'pipe', 'flood'] },
  { title: 'Overflowing garbage near market', category: 'waste', severity: 'high', neighbourhood: 'Whitefield', location: { lat: 12.9698, lng: 77.7499 }, upvotes: 18, status: 'reported', department: 'BBMP Solid Waste', estimatedCost: 5000, description: 'Garbage bins near the vegetable market have been overflowing for 4 days. Causing health hazard and foul smell.', tags: ['garbage', 'waste', 'market', 'health'] },
  { title: 'Blocked drain flooding road', category: 'drainage', severity: 'high', neighbourhood: 'Koramangala', location: { lat: 12.9299, lng: 77.6215 }, upvotes: 34, status: 'in_progress', department: 'BBMP Drainage', estimatedCost: 15000, description: 'Storm drain completely blocked with debris. Road floods even during light rain causing traffic chaos.', tags: ['drain', 'flood', 'rain', 'traffic'] },
  { title: 'Fallen tree blocking footpath', category: 'treehazard', severity: 'high', neighbourhood: 'Indiranagar', location: { lat: 12.9754, lng: 77.6384 }, upvotes: 29, status: 'resolved', department: 'BBMP Horticulture', estimatedCost: 12000, description: 'Large tree fell during last night\'s storm completely blocking the footpath. Pedestrians forced onto road.', tags: ['tree', 'fallen', 'footpath', 'storm'], resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { title: 'Second pothole on 80ft road', category: 'pothole', severity: 'critical', neighbourhood: 'Koramangala', location: { lat: 12.9340, lng: 77.6260 }, upvotes: 52, status: 'escalated', department: 'BBMP Roads', estimatedCost: 20000, description: 'Another dangerous pothole has appeared 200m from the previously reported one. Pattern suggests road quality issue.', tags: ['road', 'pothole', 'critical', 'pattern'] },
  { title: 'Sewage overflow on residential road', category: 'drainage', severity: 'critical', neighbourhood: 'Malleshwaram', location: { lat: 13.0035, lng: 77.5680 }, upvotes: 41, status: 'verified', department: 'BWSSB', estimatedCost: 35000, description: 'Sewage is overflowing onto the residential road creating serious health hazards for residents including children.', tags: ['sewage', 'overflow', 'health', 'residential'] },
  { title: 'Broken footpath tiles dangerous', category: 'pothole', severity: 'medium', neighbourhood: 'Jayanagar', location: { lat: 12.9250, lng: 77.5938 }, upvotes: 15, status: 'reported', department: 'BBMP Roads', estimatedCost: 10000, description: 'Broken and uneven footpath tiles causing trip hazards especially for elderly citizens and children.', tags: ['footpath', 'tiles', 'elderly', 'safety'] },
  { title: 'Water logging after rain', category: 'drainage', severity: 'high', neighbourhood: 'Electronic City', location: { lat: 12.8456, lng: 77.6603 }, upvotes: 38, status: 'reported', department: 'BBMP Drainage', estimatedCost: 50000, description: 'Entire stretch of road gets waterlogged after even light rain. Vehicles getting stuck. Issue recurring every monsoon.', tags: ['waterlogging', 'rain', 'monsoon', 'traffic'] },
  { title: 'Illegal construction blocking road', category: 'construction', severity: 'medium', neighbourhood: 'Rajajinagar', location: { lat: 12.9900, lng: 77.5560 }, upvotes: 12, status: 'reported', department: 'BBMP Building Regulation', estimatedCost: 0, description: 'Construction material dumped on the road without permission blocking half the road and causing traffic congestion.', tags: ['construction', 'illegal', 'road', 'traffic'] },
  { title: 'Third pothole Koramangala cluster', category: 'pothole', severity: 'high', neighbourhood: 'Koramangala', location: { lat: 12.9320, lng: 77.6230 }, upvotes: 28, status: 'escalated', department: 'BBMP Roads', estimatedCost: 18000, description: 'Third pothole reported in the same 500m stretch. Clear systemic road quality failure. Civic Brief generated.', tags: ['pothole', 'cluster', 'systemic', 'brief'], briefURL: '/brief/koramangala-road-cluster', rootCauseNote: 'Repeated potholes in this stretch suggest substandard resurfacing during last monsoon repair. Recommend contractor audit.' },
  { title: 'Streetlight flickering dangerously', category: 'streetlight', severity: 'medium', neighbourhood: 'Banashankari', location: { lat: 12.9250, lng: 77.5467 }, upvotes: 9, status: 'reported', department: 'BESCOM', estimatedCost: 6000, description: 'Streetlight on main road flickering continuously creating visual hazard for drivers especially at night.', tags: ['streetlight', 'flicker', 'hazard', 'night'] },
  { title: 'Garbage dumping in lake area', category: 'waste', severity: 'critical', neighbourhood: 'HSR Layout', location: { lat: 12.9150, lng: 77.6420 }, upvotes: 67, status: 'escalated', department: 'BBMP Solid Waste', estimatedCost: 30000, description: 'Large scale illegal garbage dumping happening near the lake. Serious environmental hazard threatening the lake ecosystem.', tags: ['garbage', 'lake', 'illegal', 'environment'] },
  { title: 'Pothole repaired successfully', category: 'pothole', severity: 'medium', neighbourhood: 'Malleshwaram', location: { lat: 13.0020, lng: 77.5700 }, upvotes: 22, status: 'resolved', department: 'BBMP Roads', estimatedCost: 12000, description: 'Pothole on main road has been successfully repaired by BBMP. Road surface smooth now.', tags: ['pothole', 'repaired', 'resolved'], resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), resolutionVerified: true, resolutionConfidence: 94 },
  { title: 'Water pipe burst near school', category: 'waterleakage', severity: 'critical', neighbourhood: 'Jayanagar', location: { lat: 12.9280, lng: 77.5960 }, upvotes: 45, status: 'in_progress', department: 'BWSSB', estimatedCost: 55000, description: 'Major water pipe burst near government school. School compound flooded. Classes disrupted for 2 days.', tags: ['water', 'pipe', 'school', 'flood'] },
  { title: 'Open manhole danger', category: 'drainage', severity: 'critical', neighbourhood: 'Whitefield', location: { lat: 12.9720, lng: 77.7520 }, upvotes: 33, status: 'verified', department: 'BBMP Drainage', estimatedCost: 8000, description: 'Open manhole without cover on busy road. Extremely dangerous especially at night. Near miss accident already reported.', tags: ['manhole', 'open', 'danger', 'night'] },
  { title: 'Banashankari streetlight cluster', category: 'streetlight', severity: 'high', neighbourhood: 'Banashankari', location: { lat: 12.9230, lng: 77.5450 }, upvotes: 19, status: 'reported', department: 'BESCOM', estimatedCost: 24000, description: '4 streetlights in the same stretch non-functional. Entire road dark at night. Residents afraid to go out.', tags: ['streetlight', 'cluster', 'dark', 'safety'] },
  { title: 'Debris from construction on road', category: 'construction', severity: 'medium', neighbourhood: 'Electronic City', location: { lat: 12.8490, lng: 77.6640 }, upvotes: 7, status: 'reported', department: 'BBMP Building Regulation', estimatedCost: 0, description: 'Construction debris spread across road from nearby building project. Causing punctures and vehicle damage.', tags: ['construction', 'debris', 'road', 'damage'] },
  { title: 'Park lights non-functional', category: 'streetlight', severity: 'low', neighbourhood: 'Indiranagar', location: { lat: 12.9760, lng: 77.6390 }, upvotes: 11, status: 'resolved', department: 'BESCOM', estimatedCost: 15000, description: 'All lights inside the neighbourhood park fixed after 3 weeks. Park now safe to use in evenings.', tags: ['park', 'lights', 'fixed', 'resolved'], resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), resolutionVerified: true, resolutionConfidence: 98 },
]

export async function seedDemoData(userId: string, userName: string = 'Demo Citizen') {
  console.log('Starting seed...')
  let count = 0
  for (const issue of SEED_ISSUES) {
    try {
      const slaDeadline = new Date()
      slaDeadline.setDate(slaDeadline.getDate() + 14)
      await addDoc(collection(db, 'issues'), {
        ...issue,
        address: `${issue.neighbourhood}, Bengaluru, Karnataka`,
        photoURL: '',
        reportedBy: userId,
        reporterName: userName,
        upvotedBy: [],
        spottedBy: [],
        escalationLevel: issue.status === 'escalated' ? 1 : 0,
        slaDeadline,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resolvedAt: (issue as any).resolvedAt || null,
      })
      count++
      console.log(`Seeded ${count}/${SEED_ISSUES.length}: ${issue.title}`)
    } catch (e) {
      console.error('Failed to seed:', issue.title, e)
    }
  }
  console.log(`✅ Done! Seeded ${count} issues.`)
}
