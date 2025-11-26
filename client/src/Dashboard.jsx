
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, query, onSnapshot, updateDoc } from 'firebase/firestore';
import { RefreshCw, Edit, Send, Repeat, Plus, Zap, Trash2, Clock, CheckCircle, Save, X } from 'lucide-react';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBR4-8o3jSPB8ab-TdCWpi4CdoHhk07jeg",
  authDomain: "groveai-acf1a.firebaseapp.com",
  projectId: "groveai-acf1a",
  storageBucket: "groveai-acf1a.firebasestorage.app",
  messagingSenderId: "866033648310",
  appId: "1:866033648310:web:885f57389a502823849c17",
  measurementId: "G-SHNGH9YXKL"
};

// Use custom token if available
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = 'ai-automation-dashboard'; // Define appId for Firestore paths

// Mock data
const MOCK_POSTS = [
    {
        id: 'draft_1',
        caption: 'New AI model update dropped! This changes everything for dynamic pricing algorithms in retail. #AIAutomation #DigitalTransformation',
        platform: 'Instagram', 
        postType: 'Feed Post',
        imageConcept: 'Digital currency graph overlaid on a neural network, cinematic style, blue and gold color palette.',
        imageUrl: 'https://placehold.co/1024x1024/29b6f6/ffffff?text=Selected+Feed+Image',
        imageOptions: [
            { id: 'img_1a', url: 'https://placehold.co/1024x1024/0000FF/ffffff?text=Option+A' },
            { id: 'img_1b', url: 'https://placehold.co/1024x1024/FFD700/000000?text=Option+B' },
            { id: 'img_1c', url: 'https://placehold.co/1024x1024/FF4500/ffffff?text=Option+C' },
            { id: 'img_1d', url: 'https://placehold.co/1024x1024/ADFF2F/000000?text=Option+D' },
        ],
        aiStatus: 'Generated - Needs Review',
        isRecurring: false,
        repeatDay: 'N/A'
    },
    {
        id: 'draft_2',
        caption: 'Happy Hour Menu Alert! 🍻 $5 AI-tini and $3 serverless wings every Friday. Come automate your thirst! Link in bio.',
        platform: 'Instagram',
        postType: 'Story',
        imageConcept: 'Vertical, vibrant image of a cocktail with serverless wings in the background, neon pink and purple style.',
        imageUrl: 'https://placehold.co/1080x1920/8e24aa/ffffff?text=Selected+Story+Image',
        imageOptions: [
            { id: 'img_2a', url: 'https://placehold.co/1080x1920/800080/ffffff?text=Story+Opt+1' },
            { id: 'img_2b', url: 'https://placehold.co/1080x1920/FFA500/000000?text=Story+Opt+2' },
            { id: 'img_2c', url: 'https://placehold.co/1080x1920/FFC0CB/000000?text=Story+Opt+3' },
            { id: 'img_2d', url: 'https://placehold.co/1080x1920/00FFFF/000000?text=Story+Opt+4' },
        ],
        aiStatus: 'Ready to Post',
        isRecurring: true,
        repeatDay: 'Friday'
    },
    {
        id: 'draft_3',
        caption: 'Did you know 80% of sales tasks can be automated? Stop wasting time and let the machines handle it!',
        platform: 'X',
        postType: 'Feed Post',
        imageConcept: 'Abstract rendering of a robot arm handing off a data sphere, minimalist design.',
        imageUrl: 'https://placehold.co/800x400/10b981/ffffff?text=Tweet+Image',
        imageOptions: [
            { id: 'img_3a', url: 'https://placehold.co/800x400/10b981/ffffff?text=Tweet+Opt+1' },
            { id: 'img_3b', url: 'https://placehold.co/800x400/FF0000/ffffff?text=Tweet+Opt+2' },
            { id: 'img_3c', url: 'https://placehold.co/800x400/008000/ffffff?text=Tweet+Opt+3' },
            { id: 'img_3d', url: 'https://placehold.co/800x400/800000/ffffff?text=Tweet+Opt+4' },
        ],
        aiStatus: 'Published',
        isRecurring: false,
        repeatDay: 'N/A'
    },
];

const PLATFORMS = ['LinkedIn', 'Instagram', 'X', 'Facebook'];
const POST_TYPES = ['Feed Post', 'Story', 'Reel'];
const AI_STATUSES = ['Generated - Needs Review', 'Draft - Needs Image Selection', 'Needs Re-Generation', 'Ready to Post', 'Published', 'Archived'];
const REPEAT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'N/A'];

// Notification hook
const useNotification = () => {
    const [messages, setMessages] = useState([]);

    const alertMessage = useCallback((message) => {
        const id = Date.now();
        setMessages(prev => [...prev, { id, text: message }]);

        setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== id));
        }, 4000);
    }, []);

    const NotificationContainer = () => (
        <div className="fixed top-4 right-4 z-[60] space-y-2">
            {messages.map(msg => (
                <div 
                    key={msg.id}
                    className="bg-yellow-400 text-gray-800 p-3 rounded-lg shadow-xl text-sm font-semibold transition-opacity duration-300"
                >
                    {msg.text}
                </div>
            ))}
        </div>
    );

    return { alertMessage, NotificationContainer };
};

// Post Card Component
const PostCard = ({ post, onEdit, onUpdateStatus }) => {
    let statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    let statusIcon = <Clock size={16} />;

    if (post.aiStatus.includes('Review')) {
        statusColor = 'bg-blue-100 text-blue-800 border-blue-300';
        statusIcon = <Edit size={16} />;
    } else if (post.aiStatus.includes('Ready')) {
        statusColor = 'bg-green-100 text-green-800 border-green-300';
        statusIcon = <CheckCircle size={16} />;
    } else if (post.aiStatus.includes('Published')) {
        statusColor = 'bg-gray-100 text-gray-700 border-gray-300';
        statusIcon = <Send size={16} />;
    } else if (post.aiStatus.includes('Image Selection')) {
        statusColor = 'bg-red-100 text-red-800 border-red-300';
        statusIcon = <Zap size={16} />;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg transition-all hover:shadow-xl overflow-hidden border border-gray-200">
            <div className={`relative w-full ${post.postType === 'Story' ? 'aspect-[9/16]' : 'aspect-square'} overflow-hidden bg-gray-100`}>
                <img 
                    src={post.imageUrl} 
                    alt={post.imageConcept} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]" 
                />
                <div className="absolute top-0 left-0 m-2 px-3 py-1 text-xs font-semibold rounded-full bg-black bg-opacity-70 text-white">
                    {post.platform} ({post.postType})
                </div>
            </div>

            <div className="p-4">
                <div className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor} mb-3`}>
                    {statusIcon} <span className="ml-1">{post.aiStatus}</span>
                </div>
                
                <p className="text-gray-800 text-sm mb-4 line-clamp-3 min-h-[48px]">{post.caption}</p>

                <div className="flex items-center text-xs text-gray-500 mb-4 space-x-4">
                    <div className="flex items-center">
                        <RefreshCw size={14} className="mr-1 text-indigo-500" />
                        <span className="truncate">AI Concept: {post.imageConcept.substring(0, 30)}...</span>
                    </div>
                    {post.isRecurring && (
                        <div className="flex items-center text-purple-600 font-semibold">
                            <Repeat size={14} className="mr-1" />
                            <span>Repeats {post.repeatDay}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between space-x-2 pt-2 border-t border-gray-100">
                    <button 
                        onClick={() => onEdit(post)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400"
                        disabled={post.aiStatus === 'Published'}
                    >
                        <Edit size={16} className="mr-1" /> Edit & Review
                    </button>
                    <button 
                        onClick={() => onUpdateStatus(post.id, 'Ready to Post')}
                        disabled={post.aiStatus === 'Ready to Post' || post.aiStatus === 'Published'}
                        className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition duration-150 shadow-sm disabled:opacity-50">
                        <Send size={16} />
                    </button>
                    <button 
                        onClick={() => onUpdateStatus(post.id, 'Archived')}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition duration-150 shadow-sm">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Edit Modal Component
const EditModal = ({ isOpen, onClose, post, onSave, alertMessage }) => {
    const [editedPost, setEditedPost] = useState(post);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (post) {
            setEditedPost(post);
        }
    }, [post]);

    if (!isOpen || !editedPost) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditedPost(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleSelectImage = (url) => {
        setEditedPost(prev => ({
            ...prev,
            imageUrl: url,
            aiStatus: prev.aiStatus === 'Draft - Needs Image Selection' ? 'Generated - Needs Review' : prev.aiStatus
        }));
        alertMessage("Image selected! Don't forget to save your changes.");
    };

    const handleRegenerate = () => {
        setIsLoading(true);
        
        setTimeout(() => {
            setIsLoading(false);
            
            const newOptions = editedPost.imageOptions.map(opt => {
                const randomColor = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                const newUrl = opt.url.replace(/([0-9A-F]{6})\/ffffff/, () => `${randomColor}/ffffff`);
                return { ...opt, url: newUrl };
            });

            setEditedPost(prev => ({
                ...prev,
                aiStatus: 'Draft - Needs Image Selection',
                imageOptions: newOptions,
                imageUrl: newOptions[0].url
            }));
            
            alertMessage("New image options generated based on the concept! Please review and select one.");
        }, 1500);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave(editedPost);
            onClose();
            alertMessage("Post successfully updated and saved!");
        } catch (error) {
            console.error("Save failed:", error);
            alertMessage("Error: Failed to save post. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-80 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Post: {editedPost.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    <div className="w-full lg:w-1/2 p-6 flex flex-col overflow-y-auto border-r border-gray-100">
                        
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Live Preview (Selected Image)</h3>
                            <div className="flex justify-center">
                                <div className={`relative rounded-lg shadow-xl overflow-hidden ${editedPost.postType === 'Story' ? 'w-48 aspect-[9/16]' : 'w-64 aspect-square'} transition-all duration-300`}>
                                    <img 
                                        src={editedPost.imageUrl} 
                                        alt="Post Preview" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end p-2">
                                         <p className="text-white text-xs leading-tight">{editedPost.caption.substring(0, 100)}...</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-2 text-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg">
                                Platform: {editedPost.platform} / Type: {editedPost.postType}
                            </div>
                        </div>

                        <form className="space-y-4 text-gray-700 flex-grow">
                            <div>
                                <label className="block text-sm font-medium mb-1">Caption / Text</label>
                                <textarea
                                    name="caption"
                                    value={editedPost.caption}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Platform</label>
                                    <select
                                        name="platform"
                                        value={editedPost.platform}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Post Type</label>
                                    <select
                                        name="postType"
                                        value={editedPost.postType}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Final AI Status</label>
                                <select
                                    name="aiStatus"
                                    value={editedPost.aiStatus}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    {AI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </form>
                    </div>
                                        {/* Right Side: Image Selection & Recurrence */}
                    <div className="w-full lg:w-1/2 p-6 flex flex-col overflow-y-auto">
                        
                        {/* Image Concept & Regeneration */}
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Image Selection</h3>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">AI Image Concept (Prompt)</label>
                                <input
                                    type="text"
                                    name="imageConcept"
                                    value={editedPost.imageConcept}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Edit this concept and click 'Re-Generate' below to request new images.
                                </p>
                            </div>

                            {/* Image options grid */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {editedPost.imageOptions && editedPost.imageOptions.map(option => (
                                    <div 
                                        key={option.id}
                                        onClick={() => handleSelectImage(option.url)}
                                        className={`relative rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all border-4 ${
                                            editedPost.imageUrl === option.url 
                                            ? 'border-green-500 ring-4 ring-green-300' 
                                            : 'border-transparent hover:border-gray-300'
                                        }`}
                                    >
                                        <img 
                                            src={option.url} 
                                            alt={`AI Option ${option.id}`} 
                                            className="w-full h-auto object-cover"
                                        />
                                        {editedPost.imageUrl === option.url && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-70 text-white font-bold text-lg">
                                                <CheckCircle size={32} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Re-Generate Button */}
                            <button 
                                onClick={handleRegenerate}
                                disabled={isLoading}
                                className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                            >
                                {isLoading ? (
                                    <RefreshCw size={16} className="animate-spin mr-2" />
                                ) : (
                                    <Zap size={16} className="mr-2" />
                                )}
                                Re-Generate 4 New Images (Mock)
                            </button>
                        </div>
                        
                        {/* Recurrence Settings */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h3 className="text-lg font-bold text-purple-800 mb-3">Recurrence</h3>
                            <label className="flex items-center text-sm font-medium cursor-pointer text-purple-800">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    checked={editedPost.isRecurring}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="ml-2 flex items-center">
                                    <Repeat size={16} className="mr-1" /> Make this a Recurring Template
                                </span>
                            </label>

                            <div className="mt-3">
                                <label className="block text-xs font-medium mb-1 text-gray-600">Repeat Day</label>
                                <select
                                    name="repeatDay"
                                    value={editedPost.repeatDay}
                                    onChange={handleChange}
                                    disabled={!editedPost.isRecurring}
                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm text-sm ${editedPost.isRecurring ? 'border-purple-300' : 'bg-gray-100 border-gray-300'}`}
                                >
                                    {REPEAT_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <RefreshCw size={16} className="animate-spin mr-2" />
                        ) : (
                            <Save size={16} className="mr-2" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const Dashboard = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [posts, setPosts] = useState(MOCK_POSTS); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null); 
    
    const { alertMessage, NotificationContainer } = useNotification();

    // Firebase Initialization
    useEffect(() => {
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(firebaseApp);
            const firebaseAuth = getAuth(firebaseApp);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const attemptSignIn = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Firebase Sign-in Failed:", error);
                }
            };
            
            attemptSignIn();

            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();

        } catch (error) {
            console.error("Firebase Initialization Failed:", error);
        }
    }, []);

    // Firestore Data Fetching
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;
        
        const postsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/staged_posts`);
        const q = query(postsCollectionRef); 

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Loaded ${fetchedPosts.length} posts from Firestore.`);
        }, (error) => {
            console.error("Error fetching staged posts:", error);
        });

        return () => unsubscribe();

    }, [isAuthReady, db, userId]);

    // Action Handlers
    const handleEditPost = useCallback((post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    }, []);
    
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingPost(null);
    }, []);

    const handleSaveEdit = useCallback(async (updatedPost) => {
        if (!db || !userId || !updatedPost.id) {
            console.error("Cannot save: DB not ready or post ID missing.");
            throw new Error("Initialization error.");
        }

        try {
            const updateFields = {
                caption: updatedPost.caption,
                imageConcept: updatedPost.imageConcept,
                imageUrl: updatedPost.imageUrl, 
                imageOptions: updatedPost.imageOptions,
                platform: updatedPost.platform,
                postType: updatedPost.postType,
                aiStatus: updatedPost.aiStatus,
                isRecurring: updatedPost.isRecurring,
                repeatDay: updatedPost.repeatDay,
                lastEdited: new Date().toISOString(),
            };
            
            const postRef = doc(db, `artifacts/${appId}/users/${userId}/staged_posts`, updatedPost.id);
            await updateDoc(postRef, updateFields);
            
            console.log(`Successfully updated post ${updatedPost.id} and saved to Firestore.`);

            setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updateFields } : p)); 

        } catch (error) {
            console.error("Failed to save edited post:", error);
            throw error; 
        }
    }, [db, userId]);

    const handleUpdateStatus = useCallback(async (postId, newStatus) => {
        if (!db || !userId) return;

        try {
            const postRef = doc(db, `artifacts/${appId}/users/${userId}/staged_posts`, postId);
            await updateDoc(postRef, {
                aiStatus: newStatus,
            });
            console.log(`Successfully updated status for ${postId} to ${newStatus}.`);

            setPosts(prev => prev.map(p => p.id === postId ? { ...p, aiStatus: newStatus } : p)); 

        } catch (error) {
            console.error("Failed to update post status in Firestore:", error);
        }
    }, [db, userId]);

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <RefreshCw size={24} className="animate-spin mr-2 text-indigo-400" />
                <span className="text-lg font-medium">Initializing AI Automation Dashboard...</span>
            </div>
        );
    }
    
    const postsInQueue = posts.filter(p => p.aiStatus !== 'Archived' && p.aiStatus !== 'Published');
    const hasPosts = postsInQueue.length > 0;

    return (
        <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-10 text-white">
            <NotificationContainer />
            <header className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-4xl font-extrabold text-indigo-400 mb-1">
                    AI Automation Content Pipeline
                </h1>
                <p className="text-gray-400">
                    Control the entire AI-driven content cycle: generate, review, edit, and schedule.
                </p>
            </header>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition duration-150 transform hover:scale-[1.01]">
                    <Zap size={20} className="mr-2" /> Generate 4 New Ideas (AI)
                </button>
                <button className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.01]">
                    <Plus size={20} className="mr-2" /> Create Manual Post
                </button>
            </div>

            {/* Posts Grid */}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Review Queue ({postsInQueue.length})</h2>
            
            {!hasPosts ? (
                <div className="bg-gray-800 p-12 rounded-xl shadow-inner text-center text-gray-500 border border-dashed border-gray-700">
                    <Send size={32} className="mx-auto mb-3 text-gray-600" />
                    <p className="font-semibold">Your queue is empty!</p>
                    <p className="text-sm">Use the 'Generate New Ideas' button to populate your content pipeline.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {postsInQueue.map((post) => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onEdit={handleEditPost} 
                            onUpdateStatus={handleUpdateStatus} 
                        />
                    ))}
                </div>
            )}
            
            <footer className="mt-12 text-center text-xs text-gray-500">
                AI Automation Agency Dashboard - User ID: {userId || 'Authenticating...'}
            </footer>

            <EditModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                post={editingPost}
                onSave={handleSaveEdit}
                alertMessage={alertMessage}
            />
        </div>
    );
};

export default Dashboard;