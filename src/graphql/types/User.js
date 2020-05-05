  
export default `
type User {
    _id: String!
    firstName: String!
    lastName:String!
    email: String!
    userType:String!
    password: String!
    city:String!
}
type Query {
    user(_id: String!): User
    users: [User]
    currentUser: User
}
type Mutation {
    addUser(firstName: String!, lastName: String!, email: String!, userType: String!, password: String!, city:String!): String
    login(email: String!, password: String!): String
    deleteUser(_id: String!): User
    editUser(_id: String!, firstName: String!, lastName:String!, password: String!, city: String!): User
}
`