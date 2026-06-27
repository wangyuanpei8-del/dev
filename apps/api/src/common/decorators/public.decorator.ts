import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** 跳过 JWT 校验（health、login 等） */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
