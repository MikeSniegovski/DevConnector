const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator/check');

const User = require('../../models/User');

/*
* @route    POST api/user
* @desc     Register user
* @access    Public
* */
router.post('/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Valid email address is required').isEmail(),
        check('password', 'Password longer then 8 character is required').isLength({min: 8}),
    ],
    async (req, res) => {
        const errors = validationResult(req); //check request data for errors

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()}) //send validation errors
        }

        const {name, email, password} = req.body;

        try {
            let user = await User.findOne({email});

            //see if user exist
            if (user) {
                return res.status(400).json({
                    errors: [{msg: 'This user exist'}]
                })
            }

            //get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            })

            // create new user instance
            user = new User({
                name,
                email,
                avatar,
                password
            })

            //encrypt pass
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            // save and return promise with user
            await user.save();

            //return jvt
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                {expiresIn: 360000},
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        msg: `done! user registered with ${email}`
                    })
                }
            );

        } catch (err) {
            console.log(err.message)
            res.status(500).send('server error ocured!');
        }

    });


module.exports = router;