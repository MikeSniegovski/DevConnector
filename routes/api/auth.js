const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator/check');

/*
* @route    GET api/auth
* @desc     Test
* @access   Public
* */
router.get(
    '/',
    auth,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select(['-password', '-__v'])

            return res.json(user);
        } catch (err) {
            return res.status(500).json({msg: 'Server Error'})
        }
    }
);

/*
* @route    POST api/auth
* @desc     Authenticate user & get token
* @access   Public
* */
router.post('/',
    [
        check('email', 'Valid email address is required').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req); //check request data for errors

        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()}) //send validation errors
        }

        const {email, password} = req.body;

        try {
            let user = await User.findOne({email});

            //see if user exist
            if (!user) {
                return res.status(400).json({
                    errors: [{msg: 'Invalid Credentials'}]
                })
            }

            //check if password matches
            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({erros: [{msg: 'Invalid cedentials'}]});
            }

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
                        msg: `done! user authenticated`
                    })
                }
            );

        } catch (err) {
            console.log(err.message)
            res.status(500).send('server error ocured!');
        }

    });

module.exports = router;