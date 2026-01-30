import panda from './panda.webp'
import raccoon from './raccoon.webp'
import cat from './cat.webp'
import dog from './dog.webp'
import rabbit from './rabbit.webp'
import bear from './bear.webp'
import elephant from './elephant.webp'
import fox from './fox.webp'
import giraffe from './giraffe.webp'
import koala from './koala.webp'
import penguin from './penguin.webp'
import frog from './frog.webp'

export type AvatarId = 'panda' | 'raccoon' | 'cat' | 'dog' | 'rabbit' | 'bear' | 'elephant' | 'fox' | 'giraffe' | 'koala' | 'penguin' | 'frog'

export const avatars: { id: AvatarId; label: string; src: string }[] = [
  { id: 'panda', label: 'Panda', src: panda },
  { id: 'raccoon', label: 'Raccoon', src: raccoon },
  { id: 'cat', label: 'Cat', src: cat },
  { id: 'dog', label: 'Dog', src: dog },
  { id: 'rabbit', label: 'Rabbit', src: rabbit },
  { id: 'bear', label: 'Bear', src: bear },
  { id: 'elephant', label: 'Elephant', src: elephant },
  { id: 'fox', label: 'Fox', src: fox },
  { id: 'giraffe', label: 'Giraffe', src: giraffe },
  { id: 'koala', label: 'Koala', src: koala },
  { id: 'penguin', label: 'Penguin', src: penguin },
  { id: 'frog', label: 'Frog', src: frog },
]

export function getAvatarSrc(avatarId?: string | null) {
  if (!avatarId) return avatars[0]?.src
  return avatars.find((a) => a.id === avatarId)?.src ?? avatars[0]?.src
}

