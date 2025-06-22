import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import { Sendemail } from '@/helpers/Sendemail';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, email, phoneNumber, password } = await req.json();

    // Check if a verified user exists with the same username
    const existingVerifiedUser = await prisma.user.findFirst({
      where: { username, isVerified: true },
    });

    if (existingVerifiedUser) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken by a verified user.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { phoneNumber }],
      },
    });

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour

    if (existingUser) {
      const isSameUser =
        existingUser.username === username &&
        existingUser.email === email &&
        existingUser.phoneNumber === phoneNumber;

      if (isSameUser) {
        if (existingUser.isVerified) {
          return NextResponse.json(
            { success: false, message: 'This user is already verified. Please log in.' },
            { status: 400 }
          );
        }

        // Reuse code if still valid
        const updatedVerifyCode = existingUser.verifyCodeExpiry > new Date()
          ? existingUser.verifyCode
          : verifyCode;

        const updatedExpiry = existingUser.verifyCodeExpiry > new Date()
          ? existingUser.verifyCodeExpiry
          : verifyCodeExpiry;

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            verifyCode: updatedVerifyCode,
            verifyCodeExpiry: updatedExpiry,
            subscriptionStatus: 'pending',
            isVerified: false,
          },
        });

     
        await Sendemail(email, username, updatedVerifyCode);

        return NextResponse.json(
          { success: true, message: 'Re-registration successful. Please verify your email.' },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Username, email, or phone number already in use.' },
        { status: 400 }
      );
    }

    // Register new user
 const newUser =   await prisma.user.create({
      data: {
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry,
        isVerified: false,
        subscriptionStatus: 'pending',
      },
    });

    
    const emailResponse = await Sendemail(email, username, verifyCode);

    if (!emailResponse.success) {
      return NextResponse.json(
        { success: false, message: 'Verification email failed to send.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Signup successful. Please check your email for verification.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { success: false, message: 'Signup failed. Try again later.' },
      { status: 500 }
    );
  }
}
