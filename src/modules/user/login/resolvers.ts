import * as bcrypt from 'bcryptjs';

import { ResolverMap } from '../../../types/graphql';
import { User } from '../../../entity/User';
import {
    invalidLoginMessage,
    pleaseConfirm,
    accountIsLocked,
} from './errorMessages';
import { userIdSessionPrefix } from '../../../utils/constants';

export const resolvers: ResolverMap = {
    Mutation: {
        login: async (
            _,
            { email, password }: GQL.ILoginOnMutationArguments,
            { session, redis, req },
        ) => {
            const user = await User.findOne({ where: { email } });

            if (!user) return invalidLoginMessage;

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return invalidLoginMessage;

            if (!user.confirmed)
                return [{ path: 'email', message: pleaseConfirm }];

            if (user.accountLocked)
                return [{ path: 'email', message: accountIsLocked }];
            // login successfull
            session.userId = user.id;
            if (req.sessionID)
                await redis.lpush(
                    `${userIdSessionPrefix}${user.id}`,
                    req.sessionID,
                );

            return null;
        },
    },
};
