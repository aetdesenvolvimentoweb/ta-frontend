// ---------- Show público ----------

export interface PublicSong {
  id: string
  title: string
  originalArtist: string
  styleName: string | null
}

export interface PublicShow {
  show: { id: string; status: string }
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

// ---------- Autenticação ----------

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  artist: { id: string; name: string; email: string }
  token: string
}

// ---------- Erros ----------

export interface ApiErrorBody {
  code: string
  message: string
}
