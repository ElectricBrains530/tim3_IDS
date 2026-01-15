import { EnvelopeOpenIcon } from '@radix-ui/react-icons';
import { Mail } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
    const { t } = await createI18nServerInstance();

    return {
        title: t('marketing:contact'),
    };
};

async function ContactPage() {
    const { t } = await createI18nServerInstance();

    return (
        <div className={'flex flex-col space-y-4 xl:space-y-8'}>
            <SitePageHeader
                title={t('marketing:contact')}
                subtitle={t('marketing:contactSubtitle')}
            />

            <div className={'container mx-auto flex max-w-4xl flex-col space-y-8 pb-16'}>
                <div className={'flex flex-col gap-8 md:flex-row'}>
                    <div className={'flex flex-1 flex-col space-y-4'}>
                        <Heading level={3}>{t('marketing:contactHeading')}</Heading>

                        <p className={'text-muted-foreground text-lg'}>
                            {t('marketing:contactDescription')}
                        </p>

                        <div className={'flex flex-col space-y-4'}>
                            <div className={'flex items-center space-x-4'}>
                                <div className={'rounded-full bg-primary/10 p-3'}>
                                    <Mail className={'h-6 w-6 text-primary'} />
                                </div>

                                <div className={'flex flex-col'}>
                                    <span className={'font-semibold'}>{t('marketing:email')}</span>
                                    <a
                                        href={'mailto:support@makerkit.dev'}
                                        className={'text-muted-foreground hover:underline'}
                                    >
                                        support@makerkit.dev
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={'flex flex-1 flex-col space-y-6 rounded-xl border p-8 shadow-sm'}>
                        <div className={'flex flex-col space-y-2'}>
                            <Heading level={4}>{t('marketing:supportHeading')}</Heading>
                            <p className={'text-muted-foreground'}>
                                {t('marketing:supportDescription')}
                            </p>
                        </div>

                        <Button asChild size={'lg'} className={'w-full'}>
                            <a href={'mailto:support@makerkit.dev'}>
                                <EnvelopeOpenIcon className={'mr-2 h-4 w-4'} />
                                <span>{t('marketing:contactSupport')}</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withI18n(ContactPage);
