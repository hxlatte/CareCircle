import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import api from '../../api';

export default function SeniorCommunity() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { startVoiceInput } = useVoice();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({}); // { postId: [comments] }
  const [showTranslated, setShowTranslated] = useState({});
  const [translatingPostId, setTranslatingPostId] = useState(null);
  const [supportingIds, setSupportingIds] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/community/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await api.get(`/community/comments/${postId}`);
      setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handlePostSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    if (!newPost.trim()) return;

    try {
      const res = await api.post('/community/posts', { content: newPost });
      setPosts([res.data, ...posts]);
      setNewPost('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setErrorMsg(err.response.data.msg);
      } else {
        setErrorMsg(t('post_failed_error') || 'Failed to post. Try again.');
      }
    }
  };

  const handleSupport = async (postId) => {
    if (supportingIds[postId]) return;
    setSupportingIds(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.patch(`/community/posts/${postId}/support`);
      setPosts(posts.map(p => p._id === postId ? { ...p, supportCount: res.data.supportCount, supportedBy: res.data.supportedBy } : p));
    } catch (err) {
      console.error('Failed to support post', err);
    } finally {
      setSupportingIds(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleTranslatePost = async (postId, targetLang) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    if (post.translations && post.translations[targetLang]) {
      setShowTranslated(prev => ({ ...prev, [postId]: !prev[postId] }));
      return;
    }

    setTranslatingPostId(postId);
    try {
      const res = await api.patch(`/community/posts/${postId}/translate`, { targetLang });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      setShowTranslated(prev => ({ ...prev, [postId]: true }));
    } catch (err) {
      console.error('Failed to translate post', err);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslatingPostId(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/community/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) {
      console.error('Failed to delete post', err);
      alert(t('delete_failed_error') || 'Failed to delete post.');
    }
  };

  const toggleComments = (postId) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      fetchComments(postId);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e?.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post('/community/comments', { postId, content: commentText });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-2xl text-stone-500 font-bold">{t('loading_community')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10">
        <h2 className="text-6xl font-extrabold text-[var(--color-primary)] mb-4">{t('community')}</h2>
        <p className="text-2xl text-stone-500">{t('community_desc')}</p>
        
        <div className="mt-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-lg flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-green-600 text-3xl">info</span>
          <p><strong>{t('community_disclaimer')}</strong></p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 mb-10">
        <div className="flex flex-col gap-4 relative">
          <div className="relative">
            <textarea 
                className="w-full bg-stone-50 rounded-2xl p-6 pr-16 text-2xl resize-none focus:outline-none focus:ring-4 focus:ring-green-100 border border-stone-200 transition-all placeholder:text-stone-400 font-bold"
                rows="3"
                placeholder={t('ask_something')}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
            ></textarea>
            <button 
                type="button"
                onClick={() => startVoiceInput(setNewPost)}
                className="absolute right-4 top-4 p-2 text-stone-400 hover:text-[var(--color-primary)] transition-colors"
            >
                <span className="material-symbols-outlined text-3xl">mic</span>
            </button>
          </div>
          {errorMsg && <p className="text-red-500 font-bold text-lg px-2">{errorMsg}</p>}
          <div className="flex justify-end">
            <button 
              onClick={handlePostSubmit}
              type="button" 
              className="bg-[var(--color-primary)] text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors"
            >
              {t('share_post')}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8" ref={bottomRef}>
        {posts.length === 0 && (
          <div className="text-center text-stone-400 py-12 text-2xl font-medium">
            {t('no_posts')}
          </div>
        )}

        {posts.map(post => {
          const isPostDifferentLanguage = post.languageCode && post.languageCode !== language;
          const isToggledTranslated = showTranslated[post._id];
          const isCurrentlyTranslating = translatingPostId === post._id;
          const displayPostText = isToggledTranslated ? (post.translations?.[language] || post.content) : post.content;
          
          const langNameMap = {
            'en': 'English',
            'te': 'Telugu',
            'hi': 'Hindi',
            'mr': 'Marathi'
          };
          const sourceLangName = langNameMap[post.languageCode] || 'Unknown';

          return (
            <div key={post._id} className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={`https://ui-avatars.com/api/?name=${post.authorName}&background=e8f5e9&color=2e7d32`} 
                  alt="avatar" 
                  className="w-16 h-16 rounded-full border-2 border-green-100"
                />
                <div>
                  <h3 className="font-bold text-2xl text-stone-800">{post.authorName}</h3>
                  <p className="text-stone-400 text-sm font-bold tracking-widest uppercase">{new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <p className="text-2xl text-stone-700 leading-relaxed mb-4">{displayPostText}</p>
              
              {isPostDifferentLanguage && (
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  {isCurrentlyTranslating ? (
                    <span className="flex items-center gap-2 text-stone-400 text-sm font-bold animate-pulse">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Translating...
                    </span>
                  ) : isToggledTranslated ? (
                    <div className="flex items-center gap-3 text-stone-400 text-sm font-bold">
                      <span>Translated from {sourceLangName}</span>
                      <button 
                        type="button" 
                        onClick={() => setShowTranslated(prev => ({ ...prev, [post._id]: false }))}
                        className="text-[var(--color-primary)] hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">translate</span>
                        View Original
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleTranslatePost(post._id, language)}
                      className="text-[var(--color-primary)] hover:underline text-sm font-bold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">translate</span>
                      Translate to {langNameMap[language] || 'Preferred Language'}
                    </button>
                  )}
                </div>
              )}
            
            <div className="flex items-center gap-6 border-t border-stone-100 pt-6">
              <button 
                onClick={() => handleSupport(post._id)}
                disabled={supportingIds[post._id]}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-colors ${post.supportedBy?.some(id => id.toString() === (user?.id || user?._id)?.toString()) ? 'bg-red-500 text-white hover:bg-red-600' : 'text-[var(--color-error)] bg-red-50 hover:bg-red-100'} ${supportingIds[post._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined">favorite</span>
                {t('support')} ({post.supportCount})
              </button>
              
              <button 
                onClick={() => toggleComments(post._id)}
                className="flex items-center gap-2 text-[var(--color-primary)] bg-green-50 hover:bg-green-100 px-6 py-3 rounded-full font-bold text-lg transition-colors"
              >
                <span className="material-symbols-outlined">forum</span>
                {t('replies')}
              </button>
              
              {user && (post.author === user.id || post.author === user._id) && (
                <button 
                  onClick={() => handleDeletePost(post._id)}
                  className="flex items-center gap-2 text-stone-500 bg-stone-100 hover:bg-red-100 hover:text-red-600 px-6 py-3 rounded-full font-bold text-lg transition-colors ml-auto"
                >
                  <span className="material-symbols-outlined">delete</span>
                  {t('delete')}
                </button>
              )}
            </div>

            {/* Comments Section */}
            {activeCommentPost === post._id && (
              <div className="mt-8 bg-stone-50 p-6 rounded-2xl animate-[slideUp_0.3s_ease-out]">
                <div className="space-y-6 mb-6 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                  {(!comments[post._id] || comments[post._id].length === 0) ? (
                    <p className="text-stone-400 italic text-lg">{t('no_replies')}</p>
                  ) : (
                    comments[post._id].map(comment => (
                      <div key={comment._id} className="flex gap-4">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${comment.authorName}&background=f3f4f6&color=374151`} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex-1">
                          <p className="font-bold text-stone-800 text-lg mb-1">{comment.authorName}</p>
                          <p className="text-stone-600 text-lg">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(null, post._id)}
                        placeholder={t('write_reply')}
                        className="w-full bg-white border border-stone-200 rounded-full px-6 pr-16 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-bold shadow-sm"
                    />
                    <button 
                        type="button"
                        onClick={() => startVoiceInput(setCommentText)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-[var(--color-primary)] transition-colors"
                    >
                        <span className="material-symbols-outlined">mic</span>
                    </button>
                  </div>
                  <button onClick={(e) => handleCommentSubmit(e, post._id)} className="bg-[var(--color-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

