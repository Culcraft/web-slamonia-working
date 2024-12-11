let currentUser = null;
let posts = []; // Global posts array for all users
let subscriptions = []; // Array of subscriptions for the logged-in user
let userPosts = []; // Posts created by the current user

// Event listeners for signup and login
document.getElementById('signupButton').addEventListener('click', signupUser);
document.getElementById('loginButton').addEventListener('click', loginUser);
document.getElementById('postButton').addEventListener('click', createNewPost);

function signupUser() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username && password) {
    const hashedPassword = hashPassword(password);
    const existingUser = JSON.parse(localStorage.getItem(username));

    if (existingUser) {
      alert('Username already exists!');
    } else {
      const newUser = {
        username: username,
        password: hashedPassword,
        subscriptions: [],
        posts: [],
        subscriberCount: 0
      };

      localStorage.setItem(username, JSON.stringify(newUser));
      alert('Account created successfully! You can now log in.');
    }
  } else {
    alert('Please enter both username and password!');
  }
}

function loginUser() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username && password) {
    const storedUser = JSON.parse(localStorage.getItem(username));

    if (storedUser && storedUser.password === hashPassword(password)) {
      currentUser = username;
      localStorage.setItem('currentUser', currentUser);
      loadUserData();
    } else {
      alert('Invalid username or password!');
    }
  } else {
    alert('Please enter both username and password!');
  }
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function loadUserData() {
  const savedUserData = JSON.parse(localStorage.getItem(currentUser));
  if (savedUserData) {
    subscriptions = savedUserData.subscriptions || [];
    userPosts = savedUserData.posts || [];
  } else {
    subscriptions = [];
    userPosts = [];
  }

  document.getElementById('userArea').style.display = 'none';
  document.getElementById('postArea').style.display = 'block';

  document.getElementById('currentUsername').innerText = currentUser;
  updateSubscriptionCount();
  displayYourPosts();
  displayAllPosts();
}

function updateSubscriptionCount() {
  document.getElementById('subscriptionCount').innerText = subscriptions.length;
}

function createNewPost() {
  const fileInput = document.getElementById('fileInput');
  const postText = document.getElementById('postText').value.trim();
  const file = fileInput.files[0];

  if (!postText && !file) {
    alert("Please add content or media.");
    return;
  }

  const newPost = {
    id: Date.now(),
    text: postText,
    file: file ? URL.createObjectURL(file) : null,
    likes: 0,
    dislikes: 0,
    comments: [],
    author: currentUser
  };

  userPosts.unshift(newPost); // Add post to user's posts
  posts.unshift(newPost); // Add post to global posts array

  saveUserData();
  displayYourPosts();
  displayAllPosts();

  // Clear input fields
  document.getElementById('fileInput').value = '';
  document.getElementById('postText').value = '';
}

function saveUserData() {
  const userData = {
    username: currentUser,
    password: JSON.parse(localStorage.getItem(currentUser)).password,
    subscriptions: subscriptions,
    posts: userPosts,
    subscriberCount: JSON.parse(localStorage.getItem(currentUser)).subscriberCount
  };
  localStorage.setItem(currentUser, JSON.stringify(userData));
}

function displayYourPosts() {
  const yourPostsContainer = document.getElementById('yourPosts');
  yourPostsContainer.innerHTML = '';

  userPosts.forEach(post => {
    const postElement = createPostElement(post);
    postElement.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id));
    yourPostsContainer.appendChild(postElement);
  });
}

function displayAllPosts() {
  const postsContainer = document.getElementById('postsContainer');
  postsContainer.innerHTML = '';

  posts.forEach(post => {
    const postElement = createPostElement(post);
    postsContainer.appendChild(postElement);
  });
}

function createPostElement(post) {
  const postElement = document.createElement('div');
  postElement.classList.add('post');

  postElement.innerHTML = `
    <p><strong>${post.author}</strong> posted:</p>
    <p>${post.text}</p>
    ${post.file ? `<img src="${post.file}" alt="Post Media">` : ''}
    <div>
      <button onclick="likePost(${post.id})">Like</button>
      <button onclick="dislikePost(${post.id})">Dislike</button>
      ${post.author === currentUser ? `<button class="delete-btn">Delete Post</button>` : ''}
    </div>
    <div>
      <input type="text" placeholder="Add a comment" onkeypress="addComment(event, ${post.id})">
      <div class="comments">
        ${post.comments.map(comment => `<p>${comment}</p>`).join('')}
      </div>
    </div>
  `;

  return postElement;
}

function likePost(postId) {
  const post = posts.find(post => post.id === postId);
  if (post) {
    post.likes++;
    saveUserData();
    displayAllPosts();
  }
}

function dislikePost(postId) {
  const post = posts.find(post => post.id === postId);
  if (post) {
    post.dislikes++;
    saveUserData();
    displayAllPosts();
  }
}

function deletePost(postId) {
  const postIndex = posts.findIndex(post => post.id === postId);
  if (postIndex > -1 && posts[postIndex].author === currentUser) {
    posts.splice(postIndex, 1);
    const userPostIndex = userPosts.findIndex(post => post.id === postId);
    if (userPostIndex > -1) userPosts.splice(userPostIndex, 1);

    saveUserData();
    displayYourPosts();
    displayAllPosts();
  } else {
    alert('You can only delete your own posts.');
  }
}

function addComment(event, postId) {
  if (event.key === 'Enter') {
    const commentText = event.target.value.trim();
    if (commentText) {
      const post = posts.find(post => post.id === postId);
      if (post) {
        post.comments.push(commentText);
        saveUserData();
        displayAllPosts();
      }
      event.target.value = '';
    }
  }
}
