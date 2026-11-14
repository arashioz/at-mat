import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRecipeCommentDto } from './dto/recipe-comment.dto';
import type { PublicRecipeComment, RecipeCommentPage } from './recipe-comments.contract';
import { RecipesService } from './recipes.service';
import { RecipeComment } from './schemas/recipe-comment.schema';

const pageSize = 8;

function publicComment({ _id, name, message, createdAt }: RecipeComment & { _id: Types.ObjectId }): PublicRecipeComment {
  return { id: _id.toHexString(), name, message, createdAt: createdAt.toISOString() };
}

@Injectable()
export class RecipeCommentsService implements OnModuleInit {
  constructor(
    @InjectModel(RecipeComment.name) private readonly comments: Model<RecipeComment>,
    private readonly recipes: RecipesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.comments.init();
  }

  async list(slug: string, before?: string): Promise<RecipeCommentPage> {
    const { id: recipeId } = await this.recipes.publicOne(slug);
    const filter = { recipeId, ...(before && { _id: { $lt: new Types.ObjectId(before) } }) };
    const rows = await this.comments.find(filter).sort({ _id: -1 }).limit(pageSize + 1).lean().exec();
    const items = rows.slice(0, pageSize).map(publicComment);
    return { items, nextCursor: rows.length > pageSize ? items[items.length - 1].id : null };
  }

  async create(slug: string, { requestId, name, message }: CreateRecipeCommentDto): Promise<PublicRecipeComment> {
    const { id: recipeId } = await this.recipes.publicOne(slug);
    const filter = { recipeId, requestId };
    try {
      const row = await this.comments.findOneAndUpdate(filter, { $setOnInsert: { name, message } }, {
        upsert: true, new: true, runValidators: true,
      }).orFail().lean().exec();
      return publicComment(row);
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await this.comments.findOne(filter).orFail().lean().exec();
      return publicComment(existing);
    }
  }
}
