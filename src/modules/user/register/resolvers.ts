import * as yup from 'yup';
import { v4 } from 'uuid';

import { User } from '../../../entity/User';
import { ResolverMap } from '../../../types/graphql';
import { formatYupError } from '../../../utils/formatYupError';
import { duplicateEmail } from './errorMessages';
import { createConfirmEmailLink } from '../../../utils/createConfirmedEmailLink';
import {
    registerPasswordValidation,
    registerEmailValidation,
} from '../../../utils/centralSchema';
import { sendEmail } from '../../../utils/sendEmail';

const schema = yup.object().shape({
    email: registerEmailValidation,
    password: registerPasswordValidation,
});

export const resolvers: ResolverMap = {
    Mutation: {
        register: async (
            _,
            args: GQL.IRegisterOnMutationArguments,
            { redis, url },
        ) => {
            try {
                await schema.validate(args, { abortEarly: false });
            } catch (err) {
                return formatYupError(err);
            }

            const { email, password } = args;

            const userAlreadyExists = await User.findOne({
                where: { email },
                select: ['id'],
            });

            if (userAlreadyExists) {
                return [
                    {
                        path: 'email',
                        message: duplicateEmail,
                    },
                ];
            }
            const user = User.create({
                id: v4(),
                email,
                password,
            });

            await user.save();

            if (process.env.NODE_ENV !== 'test') {
                const link = await createConfirmEmailLink(url, user.id, redis);
                console.log(email, link);
                await sendEmail(email, link);
            }

            return null;
        },
    },
};
