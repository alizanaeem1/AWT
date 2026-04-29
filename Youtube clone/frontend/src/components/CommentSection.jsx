import { useEffect, useState } from "react";
import { addCommentApi, deleteCommentApi, getCommentsApi } from "../api/interactionApi";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function CommentSection({ videoId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const loadComments = async () => {
    const res = await getCommentsApi(videoId);
    setComments(res.data);
  };

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addCommentApi({ videoId, content: text });
    setText("");
    loadComments();
  };

  const removeComment = async (id) => {
    await deleteCommentApi(id);
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <section>
      <h3>Comments</h3>
      {user && (
        <form onSubmit={addComment}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment" />
          <button type="submit">Post</button>
        </form>
      )}
      {comments.map((comment) => (
        <div className="comment" key={comment._id}>
          <p>
            <b>
              {comment.user?._id ? (
                <Link to={`/channel/${comment.user._id}`}>{comment.user?.name}</Link>
              ) : (
                comment.user?.name
              )}
            </b>
            : {comment.content}
          </p>
          {(user?._id === comment.user?._id || user?.id === comment.user?._id) && (
            <button onClick={() => removeComment(comment._id)}>Delete</button>
          )}
        </div>
      ))}
    </section>
  );
}

export default CommentSection;
