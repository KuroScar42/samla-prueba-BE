import Joi from "joi";

export const userSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phoneCountryCode: Joi.string().required(),
  telephone: Joi.string()
    .pattern(/^\d{7,15}$/)
    .required(), // Allows numbers between 7-15 digits
  idType: Joi.string().required(),
  idNumber: Joi.string().alphanum().min(5).max(20).required(),
  department: Joi.string().min(2).max(50).required(),
  municipality: Joi.string().min(2).max(50).required(),
  direction: Joi.string().min(5).max(255).required(),
  monthlyEarns: Joi.number().positive().precision(2).required(), // Ensures positive decimal numbers
});
