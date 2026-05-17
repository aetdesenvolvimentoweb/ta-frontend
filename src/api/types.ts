// ---------- Show público ----------

export interface PublicSong {
  id: string
  title: string
  originalArtist: string
  styleName: string | null
}

export interface PublicShow {
  show: { id: string; status: string; startTime: string }
  artist: {
    id: string
    name: string
    socials: Record<string, string>
    canReceiveTips: boolean
  }
  songs: PublicSong[]
}

// ---------- Pedido de música ----------

export interface CreateRequestBody {
  songId: string
  customerName: string
  message?: string
  tipAmountInCents: number
}

export interface CreateRequestResponse {
  id: string
  songId: string
  customerName: string
  tipAmountInCents: number
  status: string
  payment?: { checkoutUrl?: string }
}

// ---------- Dashboard do artista ----------

export interface ActiveShow {
  id: string
  artistId: string
  startTime: string
  durationHours: number
  status: 'active' | 'finished' | 'expired'
}

export interface ShowRequest {
  id: string
  songId: string
  customerName: string
  message?: string
  tipAmountInCents: number
  status: 'pending' | 'played' | 'cancelled'
  createdAt: string
}

export interface ArtistSong {
  id: string
  title: string
  originalArtist: string
  styleId: string | null
  isAvailable: boolean
}

// ---------- Autenticação ----------

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  artist: { id: string; name: string; email: string; isPremium: boolean }
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  artist: { id: string; name: string; email: string }
  token: string
}

// ---------- Estilos ----------

export interface Style {
  id: string
  name: string
}

// ---------- Repertório ----------

export interface AddSongRequest {
  title: string
  originalArtist: string
  styleName: string
}

// ---------- Perfil do artista ----------

export interface ArtistProfile {
  id: string
  name: string
  email: string
  socials: Record<string, string>
  canReceiveTips: boolean
  paymentGateway?: string
}

export interface UpdateProfileRequest {
  name?: string
  socials?: Record<string, string>
}

export interface StartPaymentConnectionResponse {
  authorizeUrl: string
  state: string
}

// ---------- Criar show ----------

export interface CreateShowRequest {
  durationHours: number
  scheduledStartTime?: string
}

export interface CreateShowResponse {
  id: string
  artistId: string
  startTime: string
  durationHours: number
  status: string
}

// ---------- Erros ----------

export interface ApiErrorBody {
  code: string
  message: string
}
