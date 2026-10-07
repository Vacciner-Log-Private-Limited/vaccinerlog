"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

/** Renders `value` as a real, scannable QR code image. */
export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("")

  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(""))
  }, [value, size])

  if (!dataUrl) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR code" width={size} height={size} className={className} />
}
