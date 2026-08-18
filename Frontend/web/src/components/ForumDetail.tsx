import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Eye, Calendar, User, Send } from 'lucide-react';
import { forumService, ForumPost, Comment, CreateComment } from '../services/forumService';
import Header from './Header';
import Toast from './Toast';

const ForumDetail: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const [forum, setForum] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  useEffect(() => {
    if (forumId) {
      loadForum();
    }
  }, [forumId]);

  const loadForum = async () => {
    try {
      setLoading(true);
      const forumData = await forumService.getPost(forumId!);
      setForum(forumData);
      setLikeCount(forumData.likes?.length || 0);
      // Check if current user has liked the post
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setLiked(forumData.likes?.includes(currentUser._id) || false);
    } catch (err) {
      setError('Failed to load forum post');
      console.error('Error loading forum:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!forum) return;
    
    try {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      
      const updatedForum = await forumService.toggleLike(forum._id);
      setForum(updatedForum);
    } catch (err) {
      // Revert optimistic update on error
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      console.error('Error toggling like:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !forum) return;
    
    try {
      setSubmittingComment(true);
      const commentData: CreateComment = { text: newComment.trim() };
      const newCommentData = await forumService.addComment(forum._id, commentData);
      
      // Add new comment to the forum
      setForum(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newCommentData]
      } : null);
      
      setNewComment('');
      setToast({
        message: 'Comment added successfully!',
        type: 'success',
        isVisible: true
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      setToast({
        message: 'Failed to add comment. Please try again.',
        type: 'error',
        isVisible: true
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header activeSection="community" onSectionChange={() => {}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading forum post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !forum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header activeSection="community" onSectionChange={() => {}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Forum post not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      )}
      
      {/* <Header activeSection="community" onSectionChange={() => {}} /> */}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Community</span>
        </button>

        {/* Forum Post */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {forum.category}
                </span>
                {forum.isPinned && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                    Pinned
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{forum.title}</h1>
              
              {/* Author and Date */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{forum.author?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(forum.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{forum.content}</p>
          </div>

          {/* Tags */}
          {forum.tags && forum.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {forum.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 border-t pt-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount} likes</span>
            </button>
                         <div className="flex items-center space-x-2">
               <MessageCircle className="h-4 w-4" />
               <span>{forum.comments?.length || 0} comments</span>
             </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>{forum.views || 0} views</span>
            </div>
          </div>
        </div>

                 {/* Comments Section */}
         <div className="bg-white rounded-xl shadow-lg p-6">
           <h2 className="text-xl font-semibold text-gray-900 mb-6">Comments ({forum.comments?.length || 0})</h2>
          
          {/* Add Comment */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Post</span>
              </button>
            </div>
          </div>

                     {/* Comments List */}
           <div className="space-y-4">
             {(!forum.comments || forum.comments.length === 0) ? (
               <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
             ) : (
               forum.comments.map(comment => (
                 <div key={comment._id} className="border-l-4 border-blue-200 pl-4 py-3">
                   <div className="flex items-start space-x-3">
                     <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                       <span className="text-white text-sm font-semibold">
                         {comment.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                       </span>
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center space-x-2 mb-1">
                         <span className="font-semibold text-gray-900">{comment.user?.name || 'Unknown'}</span>
                         <span className="text-gray-500 text-sm">{formatDate(comment.date)}</span>
                       </div>
                       <p className="text-gray-700">{comment.text}</p>
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ForumDetail;
