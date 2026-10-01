import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, upsertCategory } from "@/lib/admin.functions";
import type { Category } from "@/lib/menu";
import { Switch } from "@/components/ui/switch";

function SortableCategoryItem({
  category,
  onUpdate,
  onDelete,
}: {
  category: Category;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isNew = category.id.startsWith("new_item_");
  const [isEditing, setIsEditing] = useState(isNew);
  const [c, setC] = useState<Partial<Category>>(category);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!c.name_pt) {
      toast.error("Nome em Português é obrigatório");
      return;
    }
    
    // Auto-generate slug if missing
    if (!c.slug) {
      c.slug = c.name_pt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    setSaving(true);
    try {
      await upsertCategory({
        data: {
          id: isNew ? undefined : category.id,
          slug: c.slug,
          sort_order: Number(c.sort_order ?? 0),
          active: c.active ?? true,
          name_pt: c.name_pt,
          name_en: c.name_en ?? c.name_pt,
          name_es: c.name_es ?? c.name_pt,
        } as any,
      });
      toast.success("Categoria salva!");
      setIsEditing(false);
      onUpdate();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Nome (PT) *"
              value={c.name_pt ?? ""}
              onChange={(e) => setC({ ...c, name_pt: e.target.value })}
              autoFocus
              className="md:col-span-1"
            />
            <Input
              placeholder="Nome (EN)"
              value={c.name_en ?? ""}
              onChange={(e) => setC({ ...c, name_en: e.target.value })}
              className="md:col-span-1"
            />
            <Input
              placeholder="Nome (ES)"
              value={c.name_es ?? ""}
              onChange={(e) => setC({ ...c, name_es: e.target.value })}
              className="md:col-span-1"
            />
            <Input
              placeholder="Slug URL (opcional)"
              value={c.slug ?? ""}
              onChange={(e) => setC({ ...c, slug: e.target.value })}
              className="md:col-span-1"
            />
          </div>
        ) : (
          <div
            className="flex flex-col cursor-text"
            onClick={() => setIsEditing(true)}
            title="Clique para editar"
          >
            <span className="font-semibold">{category.name_pt}</span>
            <div className="text-xs text-muted-foreground flex gap-2">
              <span>EN: {category.name_en}</span>
              <span>ES: {category.name_es}</span>
              <span>Slug: {category.slug}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
         {isEditing ? (
            <>
              <Button size="icon" variant="ghost" onClick={save} disabled={saving} className="text-green-600 hover:text-green-700">
                <Check className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => {
                if (isNew) {
                    onDelete(category.id);
                } else {
                    setC(category);
                    setIsEditing(false);
                }
              }}>
                <X className="h-5 w-5" />
              </Button>
            </>
         ) : (
            <>
                <div className="flex items-center gap-2 mr-2">
                    <Switch
                        checked={category.active}
                        onCheckedChange={async (v) => {
                            await upsertCategory({ data: { ...category, active: v } as any });
                            onUpdate();
                        }}
                    />
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        if (confirm("Excluir categoria e todos os produtos dela?")) {
                            onDelete(category.id);
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </>
         )}
      </div>
    </div>
  );
}

export function CategoriesTab({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: () => void;
}) {
  const [localItems, setLocalItems] = useState(
    [...categories].sort((a, b) => a.sort_order - b.sort_order)
  );

  useEffect(() => {
    // Only update if no new local items exist
    if (!localItems.some(i => i.id.startsWith("new_item_"))) {
      setLocalItems([...categories].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newOrder);

      // Save new sort orders asynchronously
      for (let i = 0; i < newOrder.length; i++) {
        if (!newOrder[i].id.startsWith("new_item_") && newOrder[i].sort_order !== i) {
          await upsertCategory({
            data: { ...newOrder[i], sort_order: i } as any,
          });
        }
      }
      onChange();
    }
  };

  const handleAdd = () => {
    setLocalItems([
      ...localItems,
      {
        id: "new_item_" + Date.now(),
        name_pt: "",
        name_en: "",
        name_es: "",
        slug: "",
        active: true,
        sort_order: localItems.length,
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("new_item_")) {
      setLocalItems(localItems.filter(i => i.id !== id));
      return;
    }
    await deleteCategory({ data: { id } });
    toast.success("Categoria excluída");
    onChange();
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center bg-muted/50 p-3 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
           <GripVertical className="h-4 w-4" />
           Arraste as categorias para reordenar (Kanban). Clique no nome para editar rapidamente.
        </p>
        <Button onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localItems.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {localItems.map((cat) => (
            <SortableCategoryItem
              key={cat.id}
              category={cat}
              onUpdate={onChange}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
