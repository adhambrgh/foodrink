import { getBanners } from '../../actions';
import { EditBannerForm } from './edit-banner-form';

export default async function EditBannerPage({ params }: { params: { id: string } }) {
  const all = await getBanners(false);
  const banner = all.find((b: any) => b.id === params.id);

  if (!banner) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-muted">Banner tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <h1 className="text-xl font-bold text-text font-heading">Edit Banner</h1>
      <EditBannerForm banner={banner as any} />
    </div>
  );
}