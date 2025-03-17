import {prisma} from '@/config/db';
import { verifySchema } from '@/schema/verifySchema';

export async function POST(request: Request) {
    try {
        const { username, code } = await request.json();
        const decodedUsername = decodeURIComponent(username);
        const user = await prisma.user.findUnique({ where: { username: decodedUsername } });
    
        if (!user) {
          return Response.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }
    
        // Check if the code is correct and not expired
        const isCodeValid = user.verifyCode === code;
        const isCodeNotExpired =  user.verifyCodeExpiry && new Date(user.verifyCodeExpiry) > new Date();
    
        if (isCodeValid && isCodeNotExpired) {
          // Update the user's verification status
          await prisma.user.update({
            where: { username: decodedUsername },
            data: {
              isVerified: true,
            },
          });
          
    
          return Response.json(
            { success: true, message: 'Account verified successfully' },
            { status: 200 }
          );
        } else if (!isCodeNotExpired) {
          // Code has expired
          return Response.json(
            {
              success: false,
              message:
                'Verification code has expired. Please sign up again to get a new code.',
            },
            { status: 400 }
          );
        } else {
          // Code is incorrect
          return Response.json(
            { success: false, message: 'Incorrect verification code' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error verifying user:', error);
        return Response.json(
          { success: false, message: 'Error verifying user' },
          { status: 500 }
        );
      }
    }