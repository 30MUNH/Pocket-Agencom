import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Edit3, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { useMarketingPlans, useDeletePlan } from '../../hooks/useMarketingPlans';
import { PLAN_STATUS_LABELS, formatDate } from '../../utils/statusLabels';
import { toast } from '../../store/toastStore';

export default function MyPlans() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading, error } = useMarketingPlans();
  const deletePlan = useDeletePlan();
  const [selectedType, setSelectedType] = useState('Tất cả Loại hình');

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa kế hoạch này?')) return;
    try {
      await deletePlan.mutateAsync(id);
      toast.success('Đã xóa kế hoạch');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa kế hoạch');
    }
  };

  const filteredPlans = plans.filter((plan) => {
    return selectedType === 'Tất cả Loại hình' || plan.campaignType === selectedType;
  });

  return (
    <div className="flex-1 w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-2">
            Kế hoạch của tôi
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Quản lý và xem lại các chiến lược tiếp thị của bạn.
          </p>
        </div>
        <Link to="/marketing-kit" className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-full font-bold text-sm flex items-center gap-2">
          Tạo kế hoạch mới <ArrowRight size={16} />
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-on-surface-variant">
          <Loader2 className="animate-spin" size={24} />
          Đang tải kế hoạch...
        </div>
      )}

      {error && <div className="text-center py-16 text-error">{error.message}</div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const statusInfo = PLAN_STATUS_LABELS[plan.status] || { label: plan.status, color: 'bg-outline' };
            return (
              <div key={plan.id} className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-variant/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                  <span className="text-xs font-bold text-on-surface-variant uppercase">{statusInfo.label}</span>
                </div>
                <h3 className="font-bold text-primary mb-2 line-clamp-2">{plan.goal}</h3>
                <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{plan.campaignType}</p>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                  <Calendar size={12} />
                  {formatDate(plan.createdAt)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/marketing-kit/result?planId=${plan.id}`)}
                    className="flex-1 py-2 rounded-full bg-secondary-container/30 text-primary text-xs font-bold hover:bg-secondary-container/50"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletePlan.isPending}
                    className="p-2 rounded-full text-error hover:bg-error-container/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-16 text-on-surface-variant">
              Chưa có kế hoạch nào.{' '}
              <Link to="/marketing-kit" className="text-primary font-bold">Tạo ngay</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
