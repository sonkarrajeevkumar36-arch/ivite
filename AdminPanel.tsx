import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { InvitationCategory, Template } from '../types';
import { 
  Palette, 
  Plus, 
  Upload, 
  Link as LinkIcon, 
  List, 
  Eye, 
  Trash2, 
  Edit3, 
  AlertCircle,
  CheckCircle2,
  X,
  Type,
  Type as TypeIcon,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

const CATEGORIES: InvitationCategory[] = [
  'Wedding', 'Ring Ceremony', 'Birthday', 'Pooja', 'Bhandara',
  'Anniversary', 'Baby Shower', 'Housewarming', 'Engagement', 'Festival'
];

const FONTS = [
  { name: 'Inter (Modern)', value: "'Inter', sans-serif" },
  { name: 'Playfair (Elegant)', value: "'Playfair Display', serif" },
  { name: 'Serif (Classic)', value: 'serif' },
  { name: 'Monospace (Clean)', value: 'monospace' },
  { name: 'Cursive (Fancy)', value: 'cursive' }
];

const AdminPanel: React.FC = () => {
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvitationCategory>('Wedding');
  const [previewImage, setPreviewImage] = useState('');
  const [fields, setFields] = useState('hostName,eventTitle,date,time,location,message');
  const [style, setStyle] = useState('linear-gradient(135deg, #6366f1 0%, #a855f7 100%)');
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [textColor, setTextColor] = useState('#ffffff');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Library State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'templates'), (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)));
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('Wedding');
    setPreviewImage('');
    setFields('hostName,eventTitle,date,time,location,message');
    setStyle('linear-gradient(135deg, #6366f1 0%, #a855f7 100%)');
    setFontFamily("'Inter', sans-serif");
    setTextColor('#ffffff');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `templates/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPreviewImage(url);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please check your connection.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const templateData = {
        name,
        category,
        previewImage,
        fields: fields.split(',').map(f => f.trim()),
        style,
        fontFamily,
        textColor,
        updatedAt: new Date()
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, 'templates', editingId), templateData);
      } else {
        await addDoc(collection(db, 'templates'), {
          ...templateData,
          createdAt: new Date()
        });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (template: Template) => {
    setName(template.name);
    setCategory(template.category);
    setPreviewImage(template.previewImage);
    setFields(template.fields.join(', '));
    setStyle(template.style);
    setFontFamily(template.fontFamily || "'Inter', sans-serif");
    setTextColor(template.textColor || '#ffffff');
    setIsEditing(true);
    setEditingId(template.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'templates', id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">System <span className="gradient-text">Architect</span></h2>
            <p className="text-slate-400 font-medium">Design & Manage Your Invitation Ecosystem</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button 
              onClick={resetForm}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-white/5"
            >
              <X className="w-5 h-5" /> Cancel Edit
            </button>
          )}
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form ref={formRef} onSubmit={handleUpload} className="glass p-8 rounded-[40px] space-y-8 border-white/5 shadow-2xl relative overflow-hidden">
             {isEditing && <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse" />}
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Template Name</label>
                 <input 
                   type="text" 
                   value={name} 
                   onChange={(e) => setName(e.target.value)} 
                   placeholder="e.g. Minimalist Zen"
                   required
                   className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100"
                 />
               </div>
               <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Category</label>
                 <select 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value as InvitationCategory)}
                   className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none text-slate-100"
                 >
                   {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
               </div>
             </div>

             <div className="space-y-3">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center justify-between">
                 <div className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Preview Image</div>
                 <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 font-black"
                 >
                   {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                   {uploadingImage ? 'UPLOADING...' : 'UPLOAD FILE'}
                 </button>
               </label>
               <input 
                 type="file"
                 ref={fileInputRef}
                 onChange={handleImageFileChange}
                 className="hidden"
                 accept="image/*"
               />
               <div className="relative">
                 <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 <input 
                   type="url" 
                   value={previewImage} 
                   onChange={(e) => setPreviewImage(e.target.value)} 
                   placeholder="Or enter Image URL manually..."
                   className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2"><List className="w-3 h-3" /> Editable Fields</label>
                 <input 
                   type="text" 
                   value={fields} 
                   onChange={(e) => setFields(e.target.value)} 
                   className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100 text-sm font-mono"
                 />
               </div>
               <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Background Style (CSS)</label>
                 <input 
                   type="text" 
                   value={style} 
                   onChange={(e) => setStyle(e.target.value)} 
                   placeholder="#000 or gradient"
                   className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100 text-sm font-mono"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                    <TypeIcon className="w-3 h-3" /> Typography
                  </label>
                  <select 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100"
                  >
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Text Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden cursor-pointer p-1"
                    />
                    <input 
                      type="text" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-100 text-sm font-mono"
                    />
                  </div>
                </div>
             </div>

             <button 
               type="submit" 
               disabled={loading || uploadingImage}
               className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                 isEditing 
                 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' 
                 : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
               } disabled:opacity-50`}
             >
               {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isEditing ? <Edit3 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
               {loading ? 'Processing...' : isEditing ? 'Update Template' : 'Publish Template'}
             </button>
          </form>
        </div>

        {/* Sidebar Guidelines & Preview */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            <h4 className="font-bold mb-6 flex items-center gap-2 text-slate-300 uppercase tracking-widest text-xs"><Eye className="w-4 h-4 text-indigo-400" /> Live Preview</h4>
            <div className="aspect-[4/5] bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 flex items-center justify-center shadow-inner relative group/img">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-6 flex items-end">
                     <div style={{ fontFamily, color: textColor }}>
                       <p className="font-bold text-lg">{name || 'Template Name'}</p>
                       <p className="text-xs font-bold uppercase tracking-widest opacity-80">{category}</p>
                     </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-700 text-center p-8">
                  <Palette className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium opacity-40">Your preview will <br /> appear here</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-white/5 space-y-5 bg-indigo-600/5">
            <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Styling Tips
            </h4>
            <ul className="text-sm text-slate-400 space-y-4">
              <li className="flex gap-3 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Use <b>Playfair Display</b> for elegant formal events like weddings.</span>
              </li>
              <li className="flex gap-3 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Choose high contrast text colors against your background style.</span>
              </li>
              <li className="flex gap-3 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</span>
                <span><b>Monospace</b> works great for modern, minimal party invites.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Library Section */}
      <div className="space-y-8 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <List className="w-6 h-6 text-indigo-500" />
            Template Library 
            <span className="bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-lg ml-2">{templates.length}</span>
          </h3>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 transition-all"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {templates.map(template => (
            <div key={template.id} className="glass rounded-[40px] p-6 border-white/5 group hover:border-indigo-500/20 transition-all duration-500">
              <div className="flex gap-5">
                <div className="w-24 h-32 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5">
                  <img src={template.previewImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block mb-1">{template.category}</span>
                    <h5 className="font-bold text-lg truncate text-slate-100">{template.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">{template.fields.length} Custom Fields</p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => startEdit(template)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(template.id)}
                      className="w-12 py-2.5 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Overlay */}
              {showDeleteConfirm === template.id && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm rounded-[40px] flex items-center justify-center p-8 z-10 animate-in fade-in duration-300">
                  <div className="text-center space-y-5">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
                    <div className="space-y-2">
                      <p className="font-bold text-slate-100 text-lg">Are you sure?</p>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">This action will permanently delete "{template.name}".</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Keep It
                      </button>
                      <button 
                        onClick={() => confirmDelete(template.id)}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20"
                      >
                        Delete Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;