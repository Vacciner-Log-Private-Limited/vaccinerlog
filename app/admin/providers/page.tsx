"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { PageHeader, Panel, Table, Th, Tr, Td, Button, Input, Field } from "@/components/admin/ui"
import { Modal } from "@/components/admin/modal"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  getAdminProviders,
  createAdminProvider,
  updateAdminProvider,
  deleteAdminProvider,
  type AdminProvider,
} from "@/lib/api"

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminProvidersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState<AdminProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminProvider | "new" | null>(null)
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [reg, setReg] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState<AdminProvider | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => getAdminProviders().then(setItems)

  useEffect(() => {
    getAdminProviders()
      .then(setItems)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const openNew = () => {
    setEditing("new")
    setName("")
    setCity("")
    setReg("")
  }
  const openEdit = (p: AdminProvider) => {
    setEditing(p)
    setName(p.name)
    setCity(p.city ?? "")
    setReg(p.registrationNumber ?? "")
  }

  const save = async () => {
    if (!name.trim()) {
      showToast("Name is required.", "error")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        city: city.trim() || undefined,
        registrationNumber: reg.trim() || undefined,
      }
      if (editing === "new") await createAdminProvider(payload)
      else if (editing) await updateAdminProvider(editing.id, payload)
      showToast(editing === "new" ? "Provider added." : "Provider updated.", "success")
      setEditing(null)
      await load()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not save.", "error")
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!confirmDel) return
    setBusy(true)
    try {
      await deleteAdminProvider(confirmDel.id)
      showToast("Provider deleted.", "success")
      setItems((prev) => prev.filter((p) => p.id !== confirmDel.id))
      setConfirmDel(null)
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Could not delete.", "error")
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Providers"
        description={`${items.length} hospital${items.length === 1 ? "" : "s"} / clinic${items.length === 1 ? "" : "s"}.`}
        action={
          <Button variant="primary" onClick={openNew}>
            <Plus className="w-4 h-4" /> Add provider
          </Button>
        }
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th>Registration no.</Th>
              <Th className="text-right">Records</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-foreground whitespace-nowrap">{p.name}</Td>
                <Td className="text-muted-foreground">{p.city ?? "—"}</Td>
                <Td className="text-muted-foreground">{p.registrationNumber ?? "—"}</Td>
                <Td className="text-right tabular-nums text-muted-foreground">{p.records}</Td>
                <Td className="text-right whitespace-nowrap">
                  <Button variant="ghost" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDel(p)}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add provider" : "Edit provider"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apollo Hospital" />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Hyderabad" />
          </Field>
          <Field label="Registration number">
            <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete provider?"
        description={confirmDel?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          {confirmDel && confirmDel.records > 0
            ? `${confirmDel.records} record(s) reference this provider — they'll be kept but shown as "Provider not recorded".`
            : "This removes the provider."}
        </p>
      </Modal>
    </div>
  )
}
