const accountSchema = new mongoose.Schema({

}, {timestamps: true});

const Account = mongoose.model(('Account', accountSchema));