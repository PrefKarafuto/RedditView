const postList = document.getElementById("postList");
const postReplies = {}; // Store replies in a tree structure

// Function to read the file and display posts
async function loadPosts() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bbsName = urlParams.get("bbs");
      const datFileName = urlParams.get("dat");
      
      if (!bbsName || !datFileName) {
        console.error("Both 'bbs' and 'dat' parameters are required in the URL.");
        return;
      }
      
      const datFilePath = `../${bbsName}/dat/${datFileName}.dat`;
      const response = await fetch(datFilePath);
      const data = await response.arrayBuffer();
    const sjisArray = new Uint8Array(data);
    const sjisDecoder = new TextDecoder("sjis");
    const decodedText = sjisDecoder.decode(sjisArray);

    const posts = decodedText.split("\n");
    const postReplyCounts = {}; // Store reply counts for each post

    posts.forEach((post, index) => {
      if (post.trim() !== "") {
        const [author, email, datetimeAndUserID, content, title] = post.replace(/<br>/g,'\n')
        .replace(/<hr>/g,'!&lt;hr&gt;!')
        .replace(/<[A-Za-z0-9_"':\/?=& .,]+>/g,'')
        .replace(/\n/g,'<br>').replace(/!&lt;hr&gt;!/g,'<hr>').split("<>");
        const [date, time, isuserID] = datetimeAndUserID.split(" ");
        const datetime = date + " " + time;
        const userID = isuserID ? isuserID : "none"
        const postId = index + 1;
        const replyMatch = content.match(/&gt;&gt;(\d+)/g);
        const replies = replyMatch ? replyMatch.map(reply => parseInt(reply.match(/\d+/)[0])) : [];

        const isReply = replies.length > 0;

        const postElement = createPostElement(postId, title, author, datetime, userID, content, isReply);
        postList.appendChild(postElement);

        postReplyCounts[postId] = replies.length; // Count replies for each post

        replies.forEach(replyId => {
          if (!postReplies[replyId]) {
            postReplies[replyId] = [];
          }
          postReplies[replyId].push(postId);
        });
      }
    });

    // Display replies
    for (const postId in postReplies) {
      const replyPost = document.querySelector(`[data-post-id="${postId}"]`);
      if (replyPost) {
        const replyContainer = document.createElement("div");
        replyContainer.className = "replies";
        postReplies[postId].forEach(replyId => {
          const reply = document.querySelector(`[data-post-id="${replyId}"]`);
          if (reply) {
            replyContainer.appendChild(reply.cloneNode(true));
          }
        });
        replyPost.appendChild(replyContainer);
      }
    }
    
    // Hide posts with class "post reply" not inside a replies div
    const replyPosts = document.querySelectorAll(".post.reply");
    replyPosts.forEach(replyPost => {
      if (!replyPost.closest(".replies")) {
        replyPost.style.display = "none";
      }
    });

    // Display reply counts
    const replyCountSpans = document.querySelectorAll(".reply-count");
    replyCountSpans.forEach(replyCountSpan => {
      const postId = replyCountSpan.closest(".post").dataset.postId;
      replyCountSpan.textContent = postReplyCounts[postId] || 0;
    });
  } catch (error) {
    console.error("Error loading posts:", error);
  }
}

// Create a post element
function createPostElement(postId, title, author, datetime, userID, content, isReply) {
  const postElement = document.createElement("div");
  postElement.className = "post";
  if (isReply) {
    postElement.classList.add("reply");
  }
  postElement.dataset.postId = postId;

  // Convert URLs to links
  const contentWithLinks = content.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );

  postElement.innerHTML = `
    <h1> ${title}</h1>
    <p><strong>Author:</strong> ${author}</p>
    <p><strong>Date:</strong> ${datetime}</p>
    <p><strong>User ID:</strong> ${userID}</p>
    <p><strong>Replies:</strong> <span class="reply-count">${getReplyCount(postId)}</span></p>
    <p><strong><hr></strong> ${contentWithLinks}</p>
  `;

  return postElement;
}

// Function to get reply count for a post
function getReplyCount(postId) {
  const replyCount = postReplies[postId] ? postReplies[postId].length : 0;
  return replyCount;
}

// Load posts when the page is loaded
window.addEventListener("load", loadPosts);
