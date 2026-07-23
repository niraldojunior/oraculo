import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateInitiativeCommentDto {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content!: string;

  @ApiProperty({ description: 'User ID of the commenter' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'User name of the commenter' })
  @IsString()
  userName!: string;
}

export class UpdateInitiativeCommentDto {
  @ApiProperty({ description: 'Updated comment content' })
  @IsString()
  content!: string;
}
