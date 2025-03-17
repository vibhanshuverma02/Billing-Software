import {prisma} from '@/config/db';
import bcrypt from 'bcryptjs';
// import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';
// import { signUpSchema } from '@/schema/signUpSchema';
// import { sign } from 'crypto';
import {Sendemail} from '@/helpers/Sendemail';

export async function POST(request: Request) {
  try {
    // const body = await request.json();
    // const validationResult = signUpSchema.safeParse(body);

    // if (!validationResult.success) {
    //   return Response.json(
    //     { success: false, errors: validationResult.error.format() },
    //     { status: 400 }
    //   );
    // }
    const { username, email, phoneNumber, password } = await request.json();

    // Check if username is taken by a verified user
    const existingVerifiedUserByUsername = await prisma.user.findFirst({
      where: { username, isVerified: true },
    });

    if (existingVerifiedUserByUsername) {
      return Response.json(
        { success: false, message: 'Username is already taken' },
        { status: 400 }
      );
    }
    // Check if email exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { phoneNumber }],
      },
    });

    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    let verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

      if (existingUser) {
        const isSameUser =
          existingUser.username === username &&
          existingUser.email === email &&
          existingUser.phoneNumber === phoneNumber;
         // existingUser.isVerified ===false;
          if (isSameUser) 
              {
                if (existingUser.isVerified) {
                  return Response.json(
                    { success: false, message: 'verified user with this email n phone'},
                    { status: 400 }
                  );
                } else {
                  // Update existing user
                  const now = new Date();
                  if (existingUser.verifyCodeExpiry > now) {
                    verifyCode = existingUser.verifyCode;
                    verifyCodeExpiry = existingUser.verifyCodeExpiry;
                  } 
                  const userupdate= await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                      password: hashedPassword,
                      verifyCode,
                      verifyCodeExpiry,
                    },
                  });
                console.log(userupdate);
                  // Send verification email
               // await sendVerificationEmail(existingUser.email, existingUser.username, verifyCode);
                await Sendemail(existingUser.email, existingUser.username, verifyCode);
                  return Response.json(
                    { success: true, message: 'Password updated. Please verify your account.' },
                    { status: 200 }
                  );
                }
              }
              
            
            else {
              // Conflict: Some credentials match but not all → Reject new registration
              return Response.json(
                { success: false, message: 'Username, email, or phone number is already taken' },
                { status: 400 }
              );
            }
          }
else{
  
              
      // Create new user
     const newUser= await prisma.user.create({
        data: {
          username,
          email,
          phoneNumber,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpiry,
          isVerified: false,
          isAcceptingMessages: true,
        },
      });
    
      console.log("User created:", newUser); 
    }
    

    // Send verification email
    const emailResponse = await Sendemail(email, username, verifyCode);
//    await sendVerificationEmail(email, username, verifyCode);
    if (!emailResponse.success) {
      return Response.json(
        { success: false, message: emailResponse.message },
        { status: 500 }
      );
    }
    return Response.json(
      { success: true, message: 'User registered successfully. Please verify your account.' },
      { status: 201 }
    );
  
}
  catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      { success: false, message: 'Error registering user' },
      { status: 500 }
    );
  }
}
