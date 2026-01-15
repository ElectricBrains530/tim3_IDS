import { PageBody, PageHeader } from '@kit/ui/page';

export const metadata = {
    title: 'Availability | Tim3',
    description: 'Manage your monthly availability',
};

export default function AvailabilityPage() {
    return (
        <>
            <PageHeader
                title={'Availability'}
                description={'Set your availability for the upcoming month'}
            />

            <PageBody>
                <div className={'flex flex-col gap-4'}>
                    <p className={'text-muted-foreground'}>
                        Availability Grid Placeholder
                    </p>
                    {/* TODO: Add MonthSelector */}
                    {/* TODO: Add AvailabilityGrid */}
                </div>
            </PageBody>
        </>
    );
}
