import { Resolver } from '../../types/graphql';

export default async (
    resolver: Resolver,
    parent: any,
    args: any,
    context: any,
    info: any,
) => {
    // midlleware
    console.log('MIDDLEWARE', context.session);
    const result = await resolver(parent, args, context, info);
    return result;
};
