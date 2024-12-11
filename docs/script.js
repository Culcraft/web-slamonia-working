let currentUser = null;
let posts = [];
let subscriptions = [];
let userPosts = [];

document.getElementById('signupButton').addEventListener('click', function() {
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
});

document.getElementById('loginButton').addEventListener('click', function() {
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
});

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
  updatePostsDisplay();
  displayRecommendations();
}

function updateSubscriptionCount() {
  document.getElementById('subscriptionCount').innerText = subscriptions.length;
}

document.getElementById('postButton').addEventListener('click', function() {
  const fileInput = document.getElementById('fileInput');
  const postText = document.getElementById('postText').value;
  const file = fileInput.files[0];

  if (!postText && !file) {
    alert("Please add content or media.");
    return;
  }

  const post = createPost(postText, file);
  userPosts.unshift(post);
  posts.unshift(post);

  saveUserData();
  displayYourPosts();
  updatePostsDisplay();

  document.getElementById('fileInput').value = '';
  document.getElementById('postText').value = '';
});

function createPost(text, file) {
  const post = {
    text: text,
    file: file,
    likes: 0,
    dislikes: 0,
    comments: [],
    id: Date.now(),
    author: currentUser,
  };

  return post;
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
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
      <p><strong>${post.author}</strong> posted:</p>
      <p>${post.text}</p>
      ${post.file ? `<img src="${URL.createObjectURL(post.file)}" alt="Post Media">` : ''}
      <div>
        <button onclick="likePost(${post.id})">Like</button>
        <button onclick="dislikePost(${post.id})">Dislike</button>
        ${post.author === currentUser ? `<button onclick="deletePost(${post.id})">Delete Post</button>` : ''}
      </div>
      <div>
        <input type="text" placeholder="Add a comment" onkeypress="addComment(event, ${post.id})">
        <div class="comments">
          ${post.comments.map(comment => `<p>${comment}</p>`).join('')}
        </div>
      </div>
    `;
    yourPostsContainer.appendChild(postElement);
  });
}

function updatePostsDisplay() {
  const postsContainer = document.getElementById('postsContainer');
  postsContainer.innerHTML = '';

  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
      <p><strong>${post.author}</strong> posted:</p>
      <p>${post.text}</p>
      ${post.file ? `<img src="${URL.createObjectURL(post.file)}" alt="Post Media">` : ''}
      <div>
        <button onclick="likePost(${post.id})">Like</button>
        <button onclick="dislikePost(${post.id})">Dislike</button>
        ${post.author === currentUser ? `<button onclick="deletePost(${post.id})">Delete Post</button>` : ''}
      </div>
      <div>
        <input type="text" placeholder="Add a comment" onkeypress="addComment(event, ${post.id})">
        <div class="comments">
          ${post.comments.map(comment => `<p>${comment}</p>`).join('')}
        </div>
      </div>
    `;
    postsContainer.appendChild(postElement);
  });
}

function likePost(postId) {
  const post = posts.find(post => post.id === postId);
  if (post) {
    post.likes++;
    saveUserData();
    updatePostsDisplay();
  }
}

function dislikePost(postId) {
  const post = posts.find(post => post.id === postId);
  if (post) {
    post.dislikes++;
    saveUserData();
    updatePostsDisplay();
  }
}

function deletePost(postId) {
  // Ensure that only the user who created the post can delete it
  if (currentUser === posts.find(post => post.id === postId).author) {
    posts = posts.filter(post => post.id !== postId);
    userPosts = userPosts.filter(post => post.id !== postId);
    saveUserData();
    displayYourPosts();
    updatePostsDisplay();
  } else {
    alert('You can only delete your own posts.');
  }
}

function addComment(event, postId) {
  if (event.key === 'Enter') {
    const commentText = event.target.value;
    if (commentText.trim()) {
      const post = posts.find(post => post.id === postId);
      if (post) {
        post.comments.push(commentText.trim());
        saveUserData();
        displayYourPosts();
        updatePostsDisplay();
      }
    }
    event.target.value = '';
  }
}

function displayRecommendations() {
  const postsContainer = document.getElementById('postsContainer');
  postsContainer.innerHTML = '';

  // Sort posts by user subscriber count, prioritizing highly subscribed users
  const recommendedUsers = JSON.parse(localStorage.getItem(currentUser)).subscriptions;
  const recommendedPosts = [];

  recommendedUsers.forEach(username => {
    const user = JSON.parse(localStorage.getItem(username));
    if (user) {
      user.posts.forEach(post => {
        recommendedPosts.push(post);
      });
    }
  });

  // Sort recommended posts (More subscribers = higher priority)
  recommendedPosts.sort((a, b) => {
    const userA = JSON.parse(localStorage.getItem(a.author));
    const userB = JSON.parse(localStorage.getItem(b.author));

    return userB.subscriberCount - userA.subscriberCount;
  });

  recommendedPosts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
      <p><strong>${post.author}</strong> posted:</p>
      <p>${post.text}</p>
      ${post.file ? `<img src="${URL.createObjectURL(post.file)}" alt="Post Media">` : ''}
    `;
    postsContainer.appendChild(postElement);
  });
}

function subscribeToAccount(username) {
  if (subscriptions.includes(username)) {
    alert('You are already subscribed to this account!');
  } else {
    subscriptions.push(username);
    const user = JSON.parse(localStorage.getItem(username));
    if (user) {
      user.subscriberCount++;
      localStorage.setItem(username, JSON.stringify(user));
    }
    saveUserData();
    updateSubscriptionCount();
  }
}

function loadSubscribedPosts() {
  const subscribedPostsContainer = document.getElementById('subscribedPostsContainer');
  subscribedPostsContainer.innerHTML = '';

  subscriptions.forEach(subscription => {
    const user = JSON.parse(localStorage.getItem(subscription));
    if (user) {
      user.posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `
          <p><strong>${post.author}</strong> posted:</p>
          <p>${post.text}</p>
          ${post.file ? `<img src="${URL.createObjectURL(post.file)}" alt="Post Media">` : ''}
        `;
        subscribedPostsContainer.appendChild(postElement);
      });
    }
  });
}
