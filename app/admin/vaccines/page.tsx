"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { PageHeader, Panel, Table, Th, Tr, Td, Button, Input, Field } from "@/components/admin/ui"
import { Modal } from "@/components/admin/modal"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  getAdminVaccines,
  createAdminVaccine,
  updateAdminVaccine,
  deleteAdminVaccine,
  type AdminVaccine,
} from "@/lib/api"

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminVaccinesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState<AdminVaccine[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminVaccine | "new" | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [doses, setDoses] = useState("1")
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState<AdminVaccine | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => getAdminVaccines().then(setItems)

  useEffect(() => {
    getAdminVaccines()
      .then(setItems)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const openNew = () => {
    setEditing("new")
    setName("")
    setDescription("")
    setDoses("1")
  }
  const openEdit = (v: AdminVaccine) => {
    setEditing(v)
    setName(v.name)
    setDescription(v.description ?? "")
    setDoses(String(v.totalDoses))
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
        description: description.trim() || undefined,
        totalDoses: Number(doses) || 1,
      }
      if (editing === "new") await createAdminVaccine(payload)
      else if (editing) await updateAdminVaccine(editing.id, payload)
      showToast(editing === "new" ? "Vaccine added." : "Vaccine updated.", "success")
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
      await deleteAdminVaccine(confirmDel.id)
      showToast("Vaccine deleted.", "success")
      setItems((prev) => prev.filter((v) => v.id !== confirmDel.id))
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
        title="Vaccines"
        description={`${items.length} vaccine${items.length === 1 ? "" : "s"} in the catalog.`}
        action={
          <Button variant="primary" onClick={openNew}>
            <Plus className="w-4 h-4" /> Add vaccine
          </Button>
        }
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th className="text-right">Doses</Th>
              <Th className="text-right">Records</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <Tr key={v.id}>
                <Td className="font-medium text-foreground whitespace-nowrap">{v.name}</Td>
                <Td className="text-muted-foreground max-w-sm">{v.description ?? "—"}</Td>
                <Td className="text-right tabular-nums text-muted-foreground">{v.totalDoses}</Td>
                <Td className="text-right tabular-nums text-muted-foreground">{v.records}</Td>
                <Td className="text-right whitespace-nowrap">
                  <Button variant="ghost" onClick={() => openEdit(v)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDel(v)}
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
        title={editing === "new" ? "Add vaccine" : "Edit vaccine"}
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hepatitis B" />
          </Field>
          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </Field>
          <Field label="Total doses required">
            <Input type="number" min={1} value={doses} onChange={(e) => setDoses(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete vaccine?"
        description={confirmDel?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doDelete} disabled={busy || (confirmDel?.records ?? 0) > 0}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          {confirmDel && confirmDel.records > 0
            ? `This vaccine is used by ${confirmDel.records} record(s), so it can't be deleted.`
            : "This removes the vaccine from the catalog."}
        </p>
      </Modal>
    </div>
  )
}
