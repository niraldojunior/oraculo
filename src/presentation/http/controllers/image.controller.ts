import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ImageService } from '../../../application/services/image.service.js';

@ApiTags('images')
@Controller('api/_img')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get('collaborator/:id')
  @ApiOperation({ summary: 'Serve collaborator image by id' })
  collaborator(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
    return this.imageService.serveCollaboratorImage(req, res, id);
  }

  @Get('company/:id')
  @ApiOperation({ summary: 'Serve company image by id' })
  company(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
    return this.imageService.serveCompanyImage(req, res, id);
  }

  @Get('vendor/:id')
  @ApiOperation({ summary: 'Serve vendor image by id' })
  vendor(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
    return this.imageService.serveVendorImage(req, res, id);
  }

  @Get('skill/:id')
  @ApiOperation({ summary: 'Serve skill image by id' })
  skill(@Req() req: Request, @Res() res: Response, @Param('id') id: string): Promise<void> {
    return this.imageService.serveSkillImage(req, res, id);
  }
}
