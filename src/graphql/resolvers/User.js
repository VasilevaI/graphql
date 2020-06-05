import User from '../../models/User';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import validator from "validator";
import ValidationError from "../ValidationError";
import dotenv from 'dotenv';
dotenv.config();

export default {
    Query: {
        user: (root, args) => {
            return new Promise((resolve, reject) => {
                User.findOne(args).exec((error, response) => {
                    error ? reject(error) : resolve(response);
                })
            })
        },
        users: () => {
            return new Promise((resolve, reject) => {
                User.find({}).populate().exec((error, response) => {
                    error ? reject(error) : resolve(response);
                })
            })
        },
        currentUser: async (root, args, {user}) => {
            if(!user){
                throw new ValidationError([{
                    key: 'user',
                    message: 'user_not_authenticated'
                }])
            }
            return await User.findById(user._id);
        }

    },
    Mutation: {
        addUser: async (root, {firstName, lastName, email, password,city, userType}) => {

            let errors = [];
            if(validator.isEmpty(firstName)){
                errors.push({
                    key: 'firstName',
                    message: 'is_empty',
                })
            }

            if(validator.isEmpty(lastName)){
                errors.push({
                    key: 'lastName',
                    message: 'is_empty',
                })
            }

            if(!validator.isEmail(email)){
                errors.push({
                    key: 'email',
                    message: 'email_not_valid',
                })
            }

            if(validator.isEmpty(city)){
                errors.push({
                    key: 'city',
                    message: 'is_empty',
                })
            }

            if(!validator.isLength(password, {min: 6, max: 20})){
                errors.push({
                    key: 'password',
                    message: 'password_length',
                })
            }

            if(errors.length){
                throw new ValidationError(errors);
            }

            const newUser = await new User({
                firstName,
                lastName,
                email,
                password: await bcrypt.hash(password, 10),
                city,
                userType
            });
            if(!newUser){
                throw new Error(`Cannot create user ${email}`)
            }
            // let savedUser = null;
            try {
                await newUser.save();
            } catch (e) {
                console.log(e);
                if(e.code === 11000){
                    throw new ValidationError([{
                        key: 'email',
                        message: 'email_in_use',
                    }]);
                }
                throw new Error(`Cannot create user ${email}..`)
            }
            return jsonwebtoken.sign({
                    _id: newUser._id,
                    email: newUser.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d'
                });
        },
        login: async(root, {email, password}) => {
            const user= await User.findOne({email});
            if(!user){
                throw new Error(`Cannot find user ${email}`);
            }

            const valid = await bcrypt.compare(password, user.password);

            if(!valid){
                throw new Error(`Passwords do not match for email ${email}`);
            }

            return jsonwebtoken.sign(
                {
                    _id: user._id,
                    email: user.email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d'
                }
            )

        },
        deleteUser: (root, {_id}) => {
            return new Promise((resolve, reject) => {
                User.findByIdAndRemove({_id}).exec((error, response) => {
                    error ? reject(error) : resolve(response);
                })
            })
        },
        editUser: async (root, {_id, firstName, lastName, password, city}, {user}) => {
            if(!user){
                throw new Error(`User not authenticated`);
            }

            const response = await User.findByIdAndUpdate({_id}, {$set: {firstName, lastName, password, city}}, {new: true}).exec();
            if(!response){
                throw new Error(`Cannot save user ${_id}`);
            }

            return response;
           
        }
    }
}