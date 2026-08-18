import { useState } from "react";
import { useEngineeringFields, EngineeringField } from "@/hooks/useEngineeringFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Save, X, Archive,
  Loader2, FolderTree,
} from "lucide-react";

export const AdminFieldsManager = () => {
  const {
    fields, loading,
    createField, updateField, deleteField,
    createSpecialization, updateSpecialization, deleteSpecialization,
  } = useEngineeringFields();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldDesc, setNewFieldDesc] = useState("");
  const [newFieldIcon, setNewFieldIcon] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editField, setEditField] = useState<Partial<EngineeringField>>({});
  const [newSpec, setNewSpec] = useState<Record<string, { name: string; description: string }>>({});
  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [editSpec, setEditSpec] = useState<{ name: string; description: string }>({ name: "", description: "" });

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleCreateField = async () => {
    if (!newFieldName.trim()) return;
    const { error } = await createField(newFieldName.trim(), newFieldDesc.trim(), newFieldIcon.trim());
    if (!error) {
      setNewFieldName(""); setNewFieldDesc(""); setNewFieldIcon("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading engineering taxonomy…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <FolderTree className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Add engineering field</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            placeholder="Field name (e.g. Mechatronics)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
          />
          <Input
            placeholder="Icon key (optional)"
            value={newFieldIcon}
            onChange={(e) => setNewFieldIcon(e.target.value)}
          />
          <Input
            placeholder="Short description"
            value={newFieldDesc}
            onChange={(e) => setNewFieldDesc(e.target.value)}
            className="md:col-span-1"
          />
          <Button onClick={handleCreateField} disabled={!newFieldName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add field
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No engineering fields yet. Add the first one above.
          </p>
        )}
        {fields.map((field) => {
          const isOpen = expanded.has(field.id);
          const isEditing = editingField === field.id;
          const nsp = newSpec[field.id] || { name: "", description: "" };
          return (
            <Card key={field.id} className="p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(field.id)}
                  className="mt-1 text-muted-foreground hover:text-foreground"
                  aria-label="toggle"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={editField.name ?? ""}
                        onChange={(e) => setEditField({ ...editField, name: e.target.value })}
                        placeholder="Name"
                      />
                      <Input
                        value={editField.icon ?? ""}
                        onChange={(e) => setEditField({ ...editField, icon: e.target.value })}
                        placeholder="Icon"
                      />
                      <Input
                        value={editField.description ?? ""}
                        onChange={(e) => setEditField({ ...editField, description: e.target.value })}
                        placeholder="Description"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{field.name}</h4>
                        <Badge variant="outline" className="text-xs">{field.key}</Badge>
                        {field.is_archived && (
                          <Badge variant="secondary" className="text-xs gap-1"><Archive className="w-3 h-3" /> archived</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {field.specializations.length} specialization{field.specializations.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {field.description && (
                        <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm" variant="outline"
                        onClick={async () => {
                          await updateField(field.id, editField);
                          setEditingField(null);
                        }}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => updateField(field.id, { is_archived: !field.is_archived })}
                        title={field.is_archived ? "Unarchive" : "Archive"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          setEditingField(field.id);
                          setEditField({
                            name: field.name,
                            icon: field.icon || "",
                            description: field.description || "",
                          });
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete "${field.name}" and all its specializations?`)) {
                            void deleteField(field.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pl-7 space-y-2 border-l border-border">
                  {field.specializations.map((spec) => {
                    const editing = editingSpec === spec.id;
                    return (
                      <div key={spec.id} className="flex items-start gap-2 py-1.5">
                        {editing ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              value={editSpec.name}
                              onChange={(e) => setEditSpec({ ...editSpec, name: e.target.value })}
                            />
                            <Input
                              value={editSpec.description}
                              onChange={(e) => setEditSpec({ ...editSpec, description: e.target.value })}
                              placeholder="Description"
                            />
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{spec.name}</span>
                              <Badge variant="outline" className="text-[10px]">{spec.key}</Badge>
                              {spec.is_archived && (
                                <Badge variant="secondary" className="text-[10px]">archived</Badge>
                              )}
                            </div>
                            {spec.description && (
                              <p className="text-xs text-muted-foreground">{spec.description}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {editing ? (
                            <>
                              <Button
                                size="sm" variant="outline"
                                onClick={async () => {
                                  await updateSpecialization(spec.id, editSpec);
                                  setEditingSpec(null);
                                }}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingSpec(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => updateSpecialization(spec.id, { is_archived: !spec.is_archived })}
                              >
                                <Archive className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => {
                                  setEditingSpec(spec.id);
                                  setEditSpec({ name: spec.name, description: spec.description || "" });
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => {
                                  if (confirm(`Delete specialization "${spec.name}"?`)) {
                                    void deleteSpecialization(spec.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                    <Input
                      placeholder="New specialization"
                      value={nsp.name}
                      onChange={(e) => setNewSpec({ ...newSpec, [field.id]: { ...nsp, name: e.target.value } })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={nsp.description}
                      onChange={(e) => setNewSpec({ ...newSpec, [field.id]: { ...nsp, description: e.target.value } })}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!nsp.name.trim()) return;
                        const { error } = await createSpecialization(field.id, nsp.name.trim(), nsp.description.trim());
                        if (!error) {
                          setNewSpec({ ...newSpec, [field.id]: { name: "", description: "" } });
                        }
                      }}
                      disabled={!nsp.name.trim()}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
