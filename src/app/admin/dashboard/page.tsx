"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/notifications";
import {
    LayoutDashboard,
    Link as LinkIcon,
    Image as ImageIcon,
    Bell,
    Settings,
    LogOut,
    ChevronRight,
    Plus,
    Trash2,
    Eye,
    Save,
    Play,
    GripVertical,
    BellRing,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImageCropper from "@/components/ImageCropper";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("links");
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();
    const [config, setConfig] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<any>(null);

    // Promotions States
    const [promotions, setPromotions] = useState<any[]>([]);
    const [isAddingPromo, setIsAddingPromo] = useState(false);
    const [editingPromo, setEditingPromo] = useState<any>(null);
    const [newPromo, setNewPromo] = useState({ title: "", description: "", external_link: "", start_date: "", end_date: "", image_url: "" });
    const [pushAlert, setPushAlert] = useState({ title: "", body: "", target_url: "" });
    const [pushStats, setPushStats] = useState({ devices: 0, sent: 0 });

    // Image Crop States
    const [showCropper, setShowCropper] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [cropType, setCropType] = useState<"profile" | "header" | "promotion" | "gallery">("profile");
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, type: 'link' | 'promotion' | 'gallery', title: string } | null>(null);

    // Gallery States
    const [gallery, setGallery] = useState<any[]>([]);

    // Toast State
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/admin/login");
                return;
            }
            setAuthLoading(false);
            fetchLinks();
            fetchConfig();
            fetchPromotions();
            fetchPushStats();
            fetchGallery();
        };

        checkAuth();
    }, [router]);

    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLink, setNewLink] = useState({ title: "", url: "" });

    const fetchConfig = async () => {
        const { data } = await supabase.from("config").select("*").single();
        if (data) setConfig(data);
    };

    const fetchLinks = async () => {
        console.log("Fetching links...");
        setLoading(true);
        const { data, error } = await supabase
            .from("links")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Error fetching links:", error);
        } else if (data) {
            console.log("Links fetched successfully:", data);
            setLinks(data);
        }
        setLoading(false);
    };

    const fetchPromotions = async () => {
        const { data, error } = await supabase
            .from("promotions")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setPromotions(data);
    };

    const fetchPushStats = async () => {
        const { count: deviceCount } = await supabase
            .from("push_devices")
            .select("*", { count: 'exact', head: true });

        const { count: sentCount } = await supabase
            .from("notification_log")
            .select("*", { count: 'exact', head: true });

        setPushStats({
            devices: deviceCount || 0,
            sent: sentCount || 0
        });
    };

    const fetchGallery = async () => {
        const { data, error } = await supabase
            .from("gallery")
            .select("*")
            .order("sort_order", { ascending: true });
        if (data) setGallery(data);
    };

    const handleSendPush = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const result = await sendPushNotification(
            pushAlert.title,
            pushAlert.body,
            pushAlert.target_url
        );

        if (result.success) {
            showToast(`¡Notificación enviada con éxito a ${result.count} dispositivos!`);
            setPushAlert({ title: "", body: "", target_url: "" });
            fetchPushStats();
        } else {
            showToast("Error al enviar notificación. Por favor verifica la configuración.", "error");
        }
        setSaving(false);
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("links").insert([
            {
                title: newLink.title,
                url: newLink.url,
                is_active: true,
                sort_order: links.length + 1
            }
        ]);

        if (!error) {
            fetchLinks();
            setIsAddingLink(false);
            setNewLink({ title: "", url: "" });
        }
        setSaving(false);
    };

    const handleUpdateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLink) {
            console.error("No editingLink found");
            return;
        }
        console.log("Starting update for link ID:", editingLink.id);
        console.log("Current link state:", editingLink);

        setSaving(true);
        try {
            const payload = {
                title: editingLink.title,
                url: editingLink.url
            };
            console.log("Sending payload to Supabase:", payload);

            const { error, data } = await supabase
                .from("links")
                .update(payload)
                .eq("id", Number(editingLink.id))
                .select();

            if (error) {
                console.error("Supabase error during update:", error);
                throw error;
            }

            console.log("Update database response data:", data);

            if (!data || data.length === 0) {
                console.warn("Update succeeded but returned no data. Check RLS policies or ID presence.");
                // We'll still refresh to be sure
            }

            showToast("Enlace actualizado correctamente");
            setEditingLink(null);
            fetchLinks();
        } catch (error: any) {
            console.error("Error updating link:", error);
            showToast("Error al actualizar: " + (error.message || "Error desconocido"), "error");
        } finally {
            setSaving(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = links.findIndex(l => l.id === active.id);
            const newIndex = links.findIndex(l => l.id === over.id);
            const newLinks = arrayMove(links, oldIndex, newIndex);

            // Re-calculate all sort orders to ensure clean state
            const updatedLinks = newLinks.map((link, index) => ({
                ...link,
                sort_order: index + 1
            }));

            setLinks(updatedLinks); // Optimistic update

            // Persist each change to Supabase
            // Note: In an optimized world we'd use an RPC to update multiple rows at once
            for (const link of updatedLinks) {
                await supabase
                    .from("links")
                    .update({ sort_order: link.sort_order })
                    .eq("id", link.id);
            }
        }
    };

    const handleAddPromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("promotions").insert([
            {
                ...newPromo,
                is_active: true
            }
        ]);

        if (!error) {
            showToast("Promoción creada correctamente");
            setIsAddingPromo(false);
            setNewPromo({ title: "", description: "", external_link: "", start_date: "", end_date: "", image_url: "" });
            fetchPromotions();
        } else {
            showToast("Error al crear promoción: " + error.message, "error");
        }
        setSaving(false);
    };

    const handleUpdatePromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPromo) return;
        setSaving(true);
        const { error } = await supabase
            .from("promotions")
            .update({
                title: editingPromo.title,
                description: editingPromo.description,
                external_link: editingPromo.external_link,
                start_date: editingPromo.start_date,
                end_date: editingPromo.end_date,
                image_url: editingPromo.image_url,
                is_active: editingPromo.is_active
            })
            .eq("id", editingPromo.id);

        if (!error) {
            showToast("Promoción actualizada correctamente");
            setEditingPromo(null);
            fetchPromotions();
        } else {
            showToast("Error al actualizar promoción: " + error.message, "error");
        }
        setSaving(false);
    };

    const handleDeletePromotion = (id: number) => {
        const promo = promotions.find(p => p.id === id);
        setDeleteConfirm({ id, type: 'promotion', title: promo?.title || 'esta promoción' });
    };

    const handleDeleteLink = (id: number) => {
        const link = links.find(l => l.id === id);
        setDeleteConfirm({ id, type: 'link', title: link?.title || 'este enlace' });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            const tables = {
                promotion: 'promotions',
                link: 'links',
                gallery: 'gallery'
            };
            const table = tables[deleteConfirm.type];
            const { error } = await supabase.from(table).delete().eq("id", deleteConfirm.id);
            if (!error) {
                if (deleteConfirm.type === 'promotion') {
                    fetchPromotions();
                    showToast("Promoción eliminada correctamente");
                } else if (deleteConfirm.type === 'gallery') {
                    fetchGallery();
                    showToast("Imagen de galería eliminada correctamente");
                } else {
                    setLinks(links.filter(l => l.id !== deleteConfirm.id));
                    showToast("Enlace eliminado correctamente");
                }
            } else {
                showToast("Error al eliminar: " + error.message, "error");
            }
        } catch (error: any) {
            showToast("Error al eliminar: " + error.message, "error");
        } finally {
            setSaving(false);
            setDeleteConfirm(null);
        }
    };

    const handleDeleteGalleryImage = (id: number) => {
        const item = gallery.find(g => g.id === id);
        setDeleteConfirm({ id, type: 'gallery', title: 'esta imagen de la galería' });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "header" | "promotion" | "gallery") => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropImage(reader.result as string);
                setCropType(type);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setSaving(true);
        setShowCropper(false);

        try {
            const fileName = `${cropType}_${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("brand")
                .upload(fileName, croppedBlob, {
                    contentType: "image/jpeg",
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("brand")
                .getPublicUrl(fileName);

            if (cropType === "promotion") {
                if (editingPromo) {
                    setEditingPromo({ ...editingPromo, image_url: publicUrl });
                } else {
                    setNewPromo({ ...newPromo, image_url: publicUrl });
                }
                showToast("Imagen de promoción actualizada correctamente");
            } else if (cropType === "gallery") {
                const { error: insertError } = await supabase
                    .from("gallery")
                    .insert([{ image_url: publicUrl, sort_order: gallery.length + 1 }]);
                if (insertError) throw insertError;
                fetchGallery();
                showToast("Imagen de galería subida correctamente");
            } else {
                const fieldToUpdate = cropType === "profile" ? "profile_image_url" : "header_image_url";

                const { error: updateError } = await supabase
                    .from("config")
                    .update({ [fieldToUpdate]: publicUrl })
                    .eq("id", config.id);

                if (updateError) throw updateError;

                setConfig({ ...config, [fieldToUpdate]: publicUrl });
                showToast("Imagen actualizada correctamente");
                fetchConfig();
            }
        } catch (error: any) {
            console.error("Error processing image:", error);
            showToast("Error al procesar imagen: " + error.message, "error");
        } finally {
            setSaving(false);
            setCropImage(null);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase
            .from("config")
            .update({
                site_name: config.site_name,
                social_handle: config.social_handle,
                site_description: config.site_description,
                updated_at: new Date().toISOString()
            })
            .eq("id", config.id);

        if (!error) {
            showToast("Ajustes guardados correctamente");
        } else {
            showToast("Error al guardar ajustes: " + error.message, "error");
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
    };


    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCFB]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-brand-gold border-t-transparent animate-spin mb-4" />
                    <p className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/30 uppercase italic">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-72 bg-white border-r border-[#F0EBE5] flex flex-col z-50 transition-transform duration-300 transform
                ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
                md:relative md:translate-x-0
            `}>
                <div className="p-8 pb-12 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-brand-pearl border border-brand-gold flex items-center justify-center shadow-sm">
                            <span className="font-serif text-xl text-brand-gold italic">B</span>
                        </div>
                        <div>
                            <h2 className="font-serif text-xl text-brand-obsidian">Beelia Panel</h2>
                            <p className="text-[9px] text-brand-obsidian/30 tracking-[0.2em] font-bold uppercase">Administrador</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem
                        icon={<LayoutDashboard className="w-4 h-4" />}
                        label="Vista General"
                        active={activeTab === "overview"}
                        onClick={() => { setActiveTab("overview"); setIsMenuOpen(false); }}
                    />
                    <NavItem
                        icon={<LinkIcon className="w-4 h-4" />}
                        label="Gestión de Enlaces"
                        active={activeTab === "links"}
                        onClick={() => { setActiveTab("links"); setIsMenuOpen(false); }}
                    />
                    <NavItem
                        icon={<ImageIcon className="w-4 h-4" />}
                        label="Promociones"
                        active={activeTab === "promotions"}
                        onClick={() => { setActiveTab("promotions"); setIsMenuOpen(false); }}
                    />
                    <NavItem
                        icon={<ImageIcon className="w-5 h-5" />}
                        label="Gestión de Galería"
                        active={activeTab === "gallery"}
                        onClick={() => { setActiveTab("gallery"); setIsMenuOpen(false); }}
                    />
                    <NavItem
                        icon={<Bell className="w-5 h-5" />}
                        label="Push Alerts"
                        active={activeTab === "push"}
                        onClick={() => { setActiveTab("push"); setIsMenuOpen(false); }}
                    />
                    <div className="pt-8 pb-4">
                        <p className="px-4 text-[9px] text-brand-obsidian/30 tracking-[0.2em] font-bold uppercase mb-2">Configuración</p>
                        <NavItem
                            icon={<Settings className="w-4 h-4" />}
                            label="Ajustes de Marca"
                            active={activeTab === "settings"}
                            onClick={() => { setActiveTab("settings"); setIsMenuOpen(false); }}
                        />
                    </div>
                </nav>

                <div className="p-6 border-t border-[#F0EBE5]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-brand-obsidian/50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-bold tracking-wide">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="px-4 md:px-10 py-8 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-[#F0EBE5]/50 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 md:hidden hover:bg-brand-pearl rounded-lg text-brand-obsidian"
                        >
                            <LayoutDashboard className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl text-brand-obsidian capitalize">
                                {activeTab === "links" ? "Enlaces" : activeTab === "settings" ? "Ajustes" : activeTab}
                            </h1>
                            <p className="hidden md:block text-xs text-brand-obsidian/40 mt-1 uppercase tracking-widest font-medium">Gestiona tu presencia digital</p>
                        </div>
                    </div>

                    <div className="flex space-x-2 md:space-x-4">
                        <Link href="/" target="_blank" className="flex items-center space-x-2 px-3 md:px-6 py-2.5 bg-brand-pearl border border-[#F0EBE5] text-brand-obsidian/70 rounded-full text-[10px] md:text-xs font-bold tracking-widest hover:bg-white transition-all">
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">VER LIVE</span>
                        </Link>
                        {activeTab === "links" && (
                            <button
                                onClick={() => { setIsAddingLink(true); setEditingLink(null); }}
                                className="flex items-center space-x-2 px-3 md:px-6 py-2.5 bg-brand-obsidian text-white rounded-full text-[10px] md:text-xs font-bold tracking-widest hover:shadow-lg transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">NUEVO</span>
                            </button>
                        )}
                        {activeTab === "promotions" && (
                            <button
                                onClick={() => { setIsAddingPromo(true); setEditingPromo(null); }}
                                className="flex items-center space-x-2 px-3 md:px-6 py-2.5 bg-brand-obsidian text-white rounded-full text-[10px] md:text-xs font-bold tracking-widest hover:shadow-lg transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">NUEVA PROMO</span>
                            </button>
                        )}
                    </div>
                </header>

                <div className="p-4 md:p-10 max-w-5xl mx-auto">
                    {activeTab === "links" && (
                        <div className="space-y-6">
                            {(isAddingLink || editingLink) && (
                                <div className="bg-white border-2 border-brand-gold/30 p-6 md:p-8 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="font-serif text-xl text-brand-obsidian">
                                            {editingLink ? "Editar Enlace" : "Agregar Nuevo Enlace"}
                                        </h2>
                                        <button onClick={() => { setIsAddingLink(false); setEditingLink(null); }} className="text-brand-obsidian/30 hover:text-brand-obsidian transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <form onSubmit={editingLink ? handleUpdateLink : handleAddLink} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Título</label>
                                                <input
                                                    type="text"
                                                    value={editingLink ? editingLink.title : newLink.title}
                                                    onChange={(e) => editingLink
                                                        ? setEditingLink({ ...editingLink, title: e.target.value })
                                                        : setNewLink({ ...newLink, title: e.target.value })
                                                    }
                                                    placeholder="Ej: Nuestra Nueva Colección"
                                                    className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">URL</label>
                                                <input
                                                    type="text"
                                                    value={editingLink ? editingLink.url : newLink.url}
                                                    onChange={(e) => editingLink
                                                        ? setEditingLink({ ...editingLink, url: e.target.value })
                                                        : setNewLink({ ...newLink, url: e.target.value })
                                                    }
                                                    placeholder="https://... o #"
                                                    className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => { setIsAddingLink(false); setEditingLink(null); }}
                                                className="px-6 py-2.5 text-xs font-bold tracking-widest text-brand-obsidian/50 hover:text-brand-obsidian uppercase"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-8 py-2.5 bg-brand-obsidian text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                                            >
                                                {saving ? "Guardando..." : (editingLink ? "Actualizar" : "Crear Enlace")}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {loading ? (
                                <div className="py-20 text-center text-brand-obsidian/20 italic tracking-widest uppercase text-xs">Cargando enlaces...</div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="grid gap-4">
                                        <SortableContext
                                            items={links.map(l => l.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {links.map((link) => (
                                                <SortableItem
                                                    key={link.id}
                                                    link={link}
                                                    setEditingLink={setEditingLink}
                                                    setIsAddingLink={setIsAddingLink}
                                                    handleDeleteLink={handleDeleteLink}
                                                />
                                            ))}
                                        </SortableContext>
                                        {links.length === 0 && (
                                            <div className="py-20 text-center border-2 border-dashed border-[#F0EBE5] rounded-3xl bg-brand-pearl/20 text-brand-obsidian/30 text-xs italic">
                                                No tienes ningún enlace creado todavía.
                                            </div>
                                        )}
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="space-y-8 max-w-2xl">
                            {/* Image Management */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Profile Image */}
                                <div className="bg-white border border-[#F0EBE5] rounded-3xl p-6 shadow-sm flex flex-col items-center">
                                    <p className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/30 uppercase mb-4 w-full">Foto de Perfil</p>
                                    <div className="w-24 h-24 rounded-full border-2 border-brand-pearl overflow-hidden bg-brand-pearl mb-4">
                                        {config.profile_image_url ? (
                                            <img src={config.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-brand-gold/30">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="cursor-pointer px-6 py-2 bg-brand-pearl text-brand-obsidian/60 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-all">
                                        SUBIR FOTO
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "profile")} />
                                    </label>
                                </div>

                                {/* Header Image */}
                                <div className="bg-white border border-[#F0EBE5] rounded-3xl p-6 shadow-sm flex flex-col items-center">
                                    <p className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/30 uppercase mb-4 w-full">Imagen de Cabecera</p>
                                    <div className="w-full aspect-video rounded-2xl border-2 border-brand-pearl overflow-hidden bg-brand-pearl mb-4">
                                        {config.header_image_url ? (
                                            <img src={config.header_image_url} alt="Header" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-brand-gold/30">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="cursor-pointer px-6 py-2 bg-brand-pearl text-brand-obsidian/60 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-all">
                                        SUBIR BANNER
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "header")} />
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white border border-[#F0EBE5] rounded-3xl p-6 md:p-10 shadow-sm">
                                <form onSubmit={handleSaveConfig} className="space-y-8">
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/50 uppercase ml-1">Nombre del Sitio</label>
                                            <input
                                                type="text"
                                                value={config.site_name || ""}
                                                onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
                                                className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/50 uppercase ml-1">Social Handle (@)</label>
                                            <input
                                                type="text"
                                                value={config.social_handle || ""}
                                                onChange={(e) => setConfig({ ...config, social_handle: e.target.value })}
                                                className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/50 uppercase ml-1">Descripción corta</label>
                                            <textarea
                                                value={config.site_description || ""}
                                                onChange={(e) => setConfig({ ...config, site_description: e.target.value })}
                                                rows={3}
                                                className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm font-medium resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full sm:w-auto flex items-center justify-center space-x-3 px-10 py-4 bg-brand-gold text-white rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span className="text-sm tracking-[0.1em] font-bold uppercase">
                                            {saving ? "Guardando..." : "Guardar Cambios"}
                                        </span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === "overview" && (
                        <div className="space-y-8 md:space-y-10">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <StatCard
                                    label="Total Enlaces"
                                    value={links.length}
                                    highlight="Activos"
                                />
                                <StatCard
                                    label="Total Clicks"
                                    value={links.reduce((acc, l) => acc + (l.click_count || 0), 0)}
                                    highlight="+12% vs ayer"
                                />
                                <StatCard
                                    label="Engagement"
                                    value="Premium"
                                    highlight="Nivel Beelia"
                                />
                            </div>

                            {/* Popularity Ranking */}
                            <div className="bg-white border border-[#F0EBE5] rounded-3xl p-6 md:p-10 shadow-sm">
                                <h3 className="font-serif text-xl text-brand-obsidian mb-8">Ranking de Popularidad</h3>
                                <div className="space-y-6">
                                    {[...links]
                                        .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
                                        .map((link, idx) => (
                                            <div key={link.id} className="flex items-center justify-between group gap-4">
                                                <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                                                    <span className="text-brand-gold font-serif italic text-xl md:text-2xl w-6 md:w-8 text-center shrink-0">{idx + 1}</span>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-brand-obsidian text-sm uppercase tracking-wider truncate">{link.title}</h4>
                                                        <p className="text-[10px] text-brand-obsidian/30 font-bold uppercase tracking-widest mt-1 truncate">{link.url.replace("https://", "").replace("www.", "")}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-brand-obsidian font-serif text-lg md:text-xl block">{link.click_count || 0}</span>
                                                    <span className="text-[9px] text-brand-obsidian/30 uppercase font-bold tracking-widest">CLICKS</span>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {links.length === 0 && (
                                        <p className="text-center text-xs text-brand-obsidian/20 italic uppercase tracking-widest py-10">No hay datos disponibles aún</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "promotions" && (
                        <div className="space-y-6">
                            {(isAddingPromo || editingPromo) && (
                                <div className="bg-white border-2 border-brand-gold/30 p-6 md:p-8 rounded-[2rem] shadow-xl">
                                    <h2 className="font-serif text-xl text-brand-obsidian mb-6">
                                        {editingPromo ? "Editar Promoción" : "Nueva Promoción"}
                                    </h2>
                                    <form onSubmit={editingPromo ? handleUpdatePromotion : handleAddPromotion} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Título</label>
                                                    <input
                                                        type="text"
                                                        value={editingPromo ? editingPromo.title : newPromo.title}
                                                        onChange={(e) => editingPromo
                                                            ? setEditingPromo({ ...editingPromo, title: e.target.value })
                                                            : setNewPromo({ ...newPromo, title: e.target.value })
                                                        }
                                                        className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Descripción</label>
                                                    <textarea
                                                        value={editingPromo ? editingPromo.description : newPromo.description}
                                                        onChange={(e) => editingPromo
                                                            ? setEditingPromo({ ...editingPromo, description: e.target.value })
                                                            : setNewPromo({ ...newPromo, description: e.target.value })
                                                        }
                                                        className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Link Externo</label>
                                                    <input
                                                        type="text"
                                                        value={editingPromo ? editingPromo.external_link : newPromo.external_link}
                                                        onChange={(e) => editingPromo
                                                            ? setEditingPromo({ ...editingPromo, external_link: e.target.value })
                                                            : setNewPromo({ ...newPromo, external_link: e.target.value })
                                                        }
                                                        placeholder="https://..."
                                                        className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Banner de Promo</label>
                                                    <div className="w-full aspect-video rounded-2xl border-2 border-brand-pearl overflow-hidden bg-brand-pearl group relative">
                                                        {(editingPromo?.image_url || newPromo.image_url) ? (
                                                            <img src={editingPromo ? editingPromo.image_url : newPromo.image_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-brand-gold/30">
                                                                <ImageIcon className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                                            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Cambiar Imagen</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "promotion")} />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Inicio</label>
                                                        <input
                                                            type="date"
                                                            value={editingPromo ? (editingPromo.start_date || "").split("T")[0] : newPromo.start_date}
                                                            onChange={(e) => editingPromo
                                                                ? setEditingPromo({ ...editingPromo, start_date: e.target.value })
                                                                : setNewPromo({ ...newPromo, start_date: e.target.value })
                                                            }
                                                            className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Fin</label>
                                                        <input
                                                            type="date"
                                                            value={editingPromo ? (editingPromo.end_date || "").split("T")[0] : newPromo.end_date}
                                                            onChange={(e) => editingPromo
                                                                ? setEditingPromo({ ...editingPromo, end_date: e.target.value })
                                                                : setNewPromo({ ...newPromo, end_date: e.target.value })
                                                            }
                                                            className="w-full px-4 py-3 bg-brand-pearl/50 border border-[#F0EBE5] rounded-xl text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-6 border-t border-[#F0EBE5]">
                                            <button
                                                type="button"
                                                onClick={() => { setIsAddingPromo(false); setEditingPromo(null); }}
                                                className="px-6 py-2.5 text-xs font-bold tracking-widest text-brand-obsidian/50 hover:text-brand-obsidian uppercase"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-8 py-2.5 bg-brand-obsidian text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                            >
                                                {saving ? "Guardando..." : (editingPromo ? "Actualizar" : "Crear Promo")}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid gap-6">
                                {promotions.map((promo) => (
                                    <div key={promo.id} className="bg-white border border-[#F0EBE5] rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-full md:w-64 aspect-video md:aspect-auto overflow-hidden bg-brand-pearl shrink-0">
                                            {promo.image_url ? (
                                                <img src={promo.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-brand-gold/20">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 md:p-8 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-serif text-xl text-brand-obsidian">{promo.title}</h3>
                                                    {promo.external_link && (
                                                        <span className="text-[10px] text-brand-gold font-bold tracking-widest uppercase block mt-1">{promo.external_link.replace("https://", "")}</span>
                                                    )}
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter ${promo.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {promo.is_active ? 'Activa' : 'Pausada'}
                                                </div>
                                            </div>
                                            <p className="text-sm text-brand-obsidian/40 mt-2 line-clamp-2 italic">{promo.description || "Sin descripción"}</p>
                                            <div className="mt-auto pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center space-x-6">
                                                    <div>
                                                        <span className="block text-[8px] text-brand-obsidian/30 uppercase font-black tracking-widest mb-1">Inicia</span>
                                                        <span className="text-[11px] font-bold text-brand-obsidian/70">{promo.start_date ? new Date(promo.start_date).toLocaleDateString() : 'Inmediato'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[8px] text-brand-obsidian/30 uppercase font-black tracking-widest mb-1">Finaliza</span>
                                                        <span className="text-[11px] font-bold text-brand-obsidian/70">{promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'Indefinido'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                                                    <button
                                                        onClick={() => setEditingPromo(promo)}
                                                        className="p-3 hover:bg-brand-pearl rounded-xl text-brand-obsidian/40 hover:text-brand-obsidian transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePromotion(promo.id)}
                                                        className="p-3 hover:bg-brand-pearl rounded-xl text-brand-obsidian/40 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {promotions.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-[#F0EBE5] rounded-[3rem] bg-brand-pearl/20">
                                        <p className="text-brand-obsidian/30 italic tracking-widest uppercase text-xs">No hay promociones activas</p>
                                        <button
                                            onClick={() => setIsAddingPromo(true)}
                                            className="mt-6 text-brand-gold font-bold text-[10px] tracking-widest uppercase hover:underline"
                                        >
                                            Crear la primera ahora
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "push" && (
                        <div className="space-y-8">
                            {/* Push Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <StatCard
                                    label="Dispositivos"
                                    value={pushStats.devices}
                                    highlight="Suscritos a alertas"
                                />
                                <StatCard
                                    label="Alertas Enviadas"
                                    value={pushStats.sent}
                                    highlight="Campaña actual"
                                />
                            </div>

                            {/* Push Alert Form */}
                            <div className="bg-white border border-[#F0EBE5] rounded-[2rem] p-8 md:p-10 shadow-sm max-w-2xl">
                                <h3 className="font-serif text-2xl text-brand-obsidian mb-8 text-center sm:text-left">Lanzar Alerta Push</h3>
                                <form onSubmit={handleSendPush} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Título de la Notificación</label>
                                        <input
                                            type="text"
                                            value={pushAlert.title}
                                            onChange={(e) => setPushAlert({ ...pushAlert, title: e.target.value })}
                                            placeholder="Ej: ✨ Nueva Colección Disponible"
                                            className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">Mensaje (Cuerpo)</label>
                                        <textarea
                                            value={pushAlert.body}
                                            onChange={(e) => setPushAlert({ ...pushAlert, body: e.target.value })}
                                            placeholder="Ej: Descubre las joyas que cuentan tu historia hoy mismo..."
                                            className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl text-sm resize-none"
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] tracking-widest font-bold text-brand-obsidian/40 uppercase">URL de Destino</label>
                                        <input
                                            type="text"
                                            value={pushAlert.target_url}
                                            onChange={(e) => setPushAlert({ ...pushAlert, target_url: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full px-5 py-4 bg-brand-pearl/30 border border-[#F0EBE5] rounded-xl text-sm"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving || pushStats.devices === 0}
                                            className="w-full flex items-center justify-center space-x-3 px-10 py-4 bg-brand-obsidian text-white rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                                        >
                                            <BellRing className="w-5 h-5 text-brand-gold" />
                                            <span className="text-sm tracking-[0.1em] font-bold uppercase">Enviar Alerta a Todos</span>
                                        </button>
                                        {pushStats.devices === 0 && (
                                            <p className="text-center text-[10px] text-red-400 mt-4 font-bold uppercase tracking-widest">No hay dispositivos suscritos aún</p>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === "gallery" && (
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <h3 className="font-serif text-3xl text-brand-obsidian text-center sm:text-left">Galería de Imágenes</h3>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="gallery-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, "gallery")}
                                    />
                                    <label
                                        htmlFor="gallery-upload"
                                        className="inline-flex items-center space-x-3 px-8 py-4 bg-brand-obsidian text-brand-gold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                        <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Añadir Fotografía</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {gallery.map((item) => (
                                    <div key={item.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-brand-pearl border border-[#F0EBE5] shadow-sm hover:shadow-md transition-all">
                                        <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleDeleteGalleryImage(item.id)}
                                                className="p-4 bg-white/90 text-red-500 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {gallery.length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-[#F0EBE5] rounded-[3rem] bg-brand-pearl/20">
                                        <p className="text-brand-obsidian/30 italic tracking-widest uppercase text-xs">Aún no hay fotos en tu galería</p>
                                    </div>
                                )}
                            </div>
                            {gallery.length > 0 && (
                                <p className="text-center text-[10px] text-brand-obsidian/30 italic uppercase tracking-[0.2em]">
                                    {gallery.length} de 9 imágenes mostradas en el microsite
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Image Cropper Modal */}
            {showCropper && cropImage && (
                <ImageCropper
                    image={cropImage}
                    cropShape={cropType === "profile" ? "round" : "rect"}
                    aspect={cropType === "profile" || cropType === "gallery" ? 1 : 16 / 9}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setShowCropper(false); setCropImage(null); }}
                />
            )}

            {/* Custom Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmationModal
                    title={`¿Eliminar ${deleteConfirm.type === 'promotion' ? 'Promoción' : 'Enlace'}?`}
                    message={`¿Estás seguro de que quieres eliminar "${deleteConfirm.title}"? Esta acción no se puede deshacer.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                    loading={saving}
                />
            )}

            {/* Premium Toast Notification */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <div className={`flex items-center space-x-4 px-8 py-5 rounded-2xl shadow-2xl border ${toast.type === 'success'
                        ? 'bg-white border-green-100 text-brand-obsidian'
                        : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                        )}
                        <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function ConfirmationModal({ title, message, onConfirm, onCancel, loading }: {
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel: () => void,
    loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onCancel}
            />
            <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-[#F0EBE5] animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                    <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-brand-obsidian text-center mb-2">{title}</h3>
                <p className="text-sm text-brand-obsidian/40 text-center mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full py-4 bg-red-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg shadow-red-200 hover:bg-red-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? "Eliminando..." : "Sí, Eliminar"}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-4 bg-brand-pearl/50 text-brand-obsidian/40 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-brand-pearl hover:text-brand-obsidian transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

function SortableItem({ link, setEditingLink, setIsAddingLink, handleDeleteLink }: {
    link: any,
    setEditingLink: (l: any) => void,
    setIsAddingLink: (b: boolean) => void,
    handleDeleteLink: (id: number) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white border border-[#F0EBE5] p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDragging ? "shadow-2xl scale-[1.02] border-brand-gold" : ""}`}
        >
            <div className="flex items-center space-x-5 w-full sm:w-auto">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-brand-obsidian/20 hover:text-brand-gold transition-colors"
                >
                    <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-pearl rounded-xl flex items-center justify-center text-brand-gold shrink-0">
                    <Play className="w-4 h-4 fill-brand-gold" />
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-brand-obsidian text-sm tracking-wide truncate">{link.title}</h3>
                    <p className="text-xs text-brand-obsidian/40 mt-0.5 font-medium truncate">{link.url}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 sm:opacity-0 group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F0EBE5]">
                <button
                    onClick={() => { setEditingLink(link); setIsAddingLink(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="p-2.5 hover:bg-brand-pearl rounded-lg text-brand-obsidian/40 hover:text-brand-obsidian transition-colors"
                >
                    <Settings className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-2.5 hover:bg-brand-pearl rounded-lg text-brand-obsidian/40 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <div className="hidden sm:block w-px h-6 bg-[#F0EBE5] mx-2" />
                <div className="px-3 py-1 bg-green-50 text-[10px] text-green-600 font-bold rounded-full border border-green-100 uppercase tracking-tighter">Activo</div>
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight }: { label: string, value: string | number, highlight: string }) {
    return (
        <div className="bg-white border border-[#F0EBE5] p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all border-b-4 border-b-brand-gold/20 group">
            <p className="text-[10px] tracking-[0.2em] font-bold text-brand-obsidian/30 uppercase mb-4">{label}</p>
            <h3 className="font-serif text-5xl text-brand-obsidian group-hover:scale-105 transition-transform origin-left duration-500">{value}</h3>
            <p className="text-[9px] tracking-widest text-brand-gold font-bold uppercase mt-4">{highlight}</p>
        </div>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group ${active
                ? "bg-brand-obsidian text-white shadow-lg translate-x-1"
                : "text-brand-obsidian/50 hover:bg-brand-pearl hover:text-brand-obsidian"
                }`}
        >
            <div className="flex items-center space-x-4">
                <span className={active ? "text-brand-gold" : "text-inherit"}>{icon}</span>
                <span className="text-sm font-bold tracking-tight">{label}</span>
            </div>
            {active && <ChevronRight className="w-4 h-4 text-brand-gold/50" />}
        </button>
    );
}
