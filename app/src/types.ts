export type Scale = 'world' | 'levant' | 'local'
export type Confidence = 'high' | 'medium' | 'low'

export interface CameraState {
  center: [number, number]
  zoom: number
  pitch?: number
  bearing?: number
}

export interface AtlasLocation {
  id: string
  name: string
  lon: number
  lat: number
  kind: string
  periods: string[]
  scale: Scale
  confidence: Confidence
  why: string
  status?: Record<string, string>
}

export interface HistoricalActor {
  id: string
  name: string
  category: string
  periods: string[]
  scale: Scale
  interest: string
  status: string
  confidence: Confidence
  anchor?: [number, number]
}

export interface StoryBeat {
  label: string
  text: string
  camera?: CameraState
}

export interface HistoricalPeriod {
  id: string
  chapter: string
  label: string
  subtitle: string
  thesis: string
  dateLabel: string
  scale: Scale
  camera: CameraState
  actorIds: string[]
  locationIds: string[]
  beats: StoryBeat[]
  changes: string[]
  mapNote: string
}

export interface AtlasRoute {
  id: string
  name: string
  periods: string[]
  scale: Scale
  confidence: Confidence
  coordinates: [number, number][]
}
