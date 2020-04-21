const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
  
    const util = require('util')
    const redis = require('redis')
    const client = redis.createClient("redis://127.0.0.1:6379")
    client.get = util.promisify(client.get)

    // do we have data
    const cachedBlogs = await client.get(req.user.id)

    // if yes: respons
    if (cachedBlogs) {
      console.log("SERVING FROM CACHE")
      return res.send(JSON.parse(cachedBlogs))
    }
    // if no: respond and update
    console.log("SERVING FROM MONGODB")
    const blogs = await Blog.find({ _user: req.user.id });
    client.set(req.user.id, JSON.stringify(blogs))

    res.send(blogs);
  });

  app.post('/api/blogs', requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
