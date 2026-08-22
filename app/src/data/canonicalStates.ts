import rawStates from '../../../data/states/actor-period-states.v1.json'
import actors1 from '../../../data/master/actors.v1.part1.json'
import actors2 from '../../../data/master/actors.v1.part2.json'
import actors3 from '../../../data/master/actors.v1.part3.json'
import actors4 from '../../../data/master/actors.v1.part4.json'

export interface ActorPeriodState {
  period: string
  actor_id: string
  status: string
  core_control: string
  influence: string
  contested: string
  allies: string
  enemies: string
  interest: string
  visibility_scale: string
  certainty: string
  notes: string
  sources?: string
}

type CanonicalActor = { id: string; name: string }

export const actorPeriodStates = rawStates as ActorPeriodState[]
const canonicalActors = [...actors1, ...actors2, ...actors3, ...actors4] as CanonicalActor[]
const actorNames = new Map(canonicalActors.map(actor => [actor.id, actor.name]))

export const statesForPeriod = (period: string) => actorPeriodStates.filter(state => state.period === period)
export const canonicalActorName = (actorId: string) => actorNames.get(actorId) ?? actorId
